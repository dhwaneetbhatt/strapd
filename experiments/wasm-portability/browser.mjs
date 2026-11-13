// One isolated browser harness; the Node entry point serves it and drives Playwright.
if (typeof window === "undefined") {
	const { createServer } = await import("node:http");
	const { readFile, writeFile } = await import("node:fs/promises");
	const { resolve, extname, sep } = await import("node:path");
	const { createRequire } = await import("node:module");
	const require = createRequire(
		new URL("../../webapp/package.json", import.meta.url),
	);
	const { chromium } = require("@playwright/test");
	const root = resolve(".");
	const served = new Map();
	const imports = Object.fromEntries(
		["cli", "clocks", "filesystem", "io", "random"].map((name) => [
			`@bytecodealliance/preview2-shim/${name}`,
			`/node_modules/@bytecodealliance/preview2-shim/dist/browser/${name}.js`,
		]),
	);
	const server = createServer(async (request, response) => {
		try {
			const pathname = decodeURIComponent(
				new URL(request.url, "http://localhost").pathname,
			);
			if (pathname === "/") {
				response.setHeader("Content-Type", "text/html");
				response.end(
					`<script type="importmap">${JSON.stringify({ imports })}</script><script type="module" src="/browser.mjs"></script>`,
				);
				return;
			}
			const path = resolve(root, `.${pathname}`);
			if (!path.startsWith(root + sep)) {
				response.writeHead(403).end();
				return;
			}
			const type = {
				".js": "text/javascript",
				".mjs": "text/javascript",
				".wasm": "application/wasm",
				".json": "application/json",
			}[extname(path)];
			response.setHeader("Content-Type", type ?? "application/octet-stream");
			const data = await readFile(path);
			served.set(pathname, data.length);
			response.end(data);
		} catch {
			response.writeHead(404).end();
		}
	});
	await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
	let browser;
	try {
		browser = await chromium.launch({ headless: true });
		const context = await browser.newContext({ timezoneId: "UTC" });
		const page = await context.newPage();
		page.on("pageerror", (error) => console.error(error));
		await page.goto(`http://127.0.0.1:${server.address().port}/`);
		await page.waitForFunction(() => window.pocFinished, { timeout: 180000 });
		const result = await page.evaluate(() => window.pocFinished);
		if (result.error) throw new Error(result.error);
		await writeFile("build/browser.csv", result.csv);
		await writeFile(
			"build/browser-startup.json",
			JSON.stringify(result.startup, null, 2) + "\n",
		);
		console.log(result.summary);
		// Separate context demonstrates the timezone difference without changing the WebApp.
		const local = await browser.newContext({ timezoneId: "Asia/Kolkata" });
		const localPage = await local.newPage();
		await localPage.goto(
			`http://127.0.0.1:${server.address().port}/?timezone-only`,
		);
		await localPage.waitForFunction(() => window.pocFinished);
		const timezone = await localPage.evaluate(() => window.pocFinished);
		if (timezone.error) throw new Error(timezone.error);
		await writeFile(
			"build/browser-timezone.json",
			JSON.stringify(timezone, null, 2) + "\n",
		);
		await writeFile(
			"build/browser-assets.json",
			JSON.stringify(Object.fromEntries(served), null, 2) + "\n",
		);
		console.log("Timezone comparison:", timezone);
	} finally {
		await browser?.close();
		await new Promise((resolve) => server.close(resolve));
	}
} else {
	const encoder = new TextEncoder();
	const decoder = new TextDecoder();
	const assert = (condition, detail) => {
		if (!condition) throw new Error(JSON.stringify(detail));
	};
	const names = [
		null,
		"detect",
		"mask",
		"decode",
		"sample",
		"uuid",
		"timestamp",
	];
	const canonical = (value) =>
		Array.isArray(value)
			? value.map(canonical)
			: value && typeof value === "object"
				? Object.fromEntries(
						Object.keys(value)
							.sort()
							.map((key) => [key, canonical(value[key])]),
					)
				: value;

	async function bufferHost() {
		const bytes = await (await fetch("/build/buffer.wasm")).arrayBuffer();
		let started = performance.now();
		const module = await WebAssembly.compile(bytes);
		const compile_ms = performance.now() - started;
		let memory;
		const view = () => new DataView(memory.buffer);
		const wasi = {
			random_get(pointer, length) {
				for (let i = 0; i < length; i += 65536)
					crypto.getRandomValues(
						new Uint8Array(
							memory.buffer,
							pointer + i,
							Math.min(65536, length - i),
						),
					);
				return 0;
			},
			clock_time_get(clock, _precision, pointer) {
				view().setBigUint64(
					pointer,
					BigInt(
						Math.floor((clock === 0 ? Date.now() : performance.now()) * 1e6),
					),
					true,
				);
				return 0;
			},
			environ_sizes_get(count, size) {
				view().setUint32(count, 0, true);
				view().setUint32(size, 0, true);
				return 0;
			},
			environ_get() {
				return 0;
			},
			fd_write() {
				throw new Error("unexpected guest stdio");
			},
			proc_exit(code) {
				throw new Error(`guest exit ${code}`);
			},
		};
		assert(
			WebAssembly.Module.imports(module).every(
				(item) => item.module === "wasi_snapshot_preview1" && item.name in wasi,
			),
			"unexpected imports",
		);
		started = performance.now();
		const { exports } = await WebAssembly.instantiate(module, {
			wasi_snapshot_preview1: wasi,
		});
		const instantiate_ms = performance.now() - started;
		memory = exports.memory;
		return {
			startup: { compile_ms, instantiate_ms },
			memory: () => memory.buffer.byteLength,
			invoke(test, raw) {
				const input = raw ?? encoder.encode(test.input);
				const pointer = exports.input_resize(input.length);
				assert(pointer !== 0, "input allocation failed");
				new Uint8Array(memory.buffer, pointer, input.length).set(input);
				const status = exports.call(
					test.operation,
					test.option,
					BigInt(test.seed),
					BigInt(test.timestamp),
				);
				const out = new Uint8Array(
					memory.buffer,
					exports.output_ptr(),
					exports.output_len(),
				);
				if (status) return { error: true, value: decoder.decode(out) };
				if (test.operation === 1) {
					const integers = new DataView(
						out.buffer,
						out.byteOffset,
						out.byteLength,
					);
					const value = [];
					for (let offset = 0; offset < out.length; offset += 12)
						value.push({
							category: integers.getUint32(offset, true),
							start: integers.getUint32(offset + 4, true),
							end: integers.getUint32(offset + 8, true),
						});
					return { error: false, value };
				}
				if (test.operation === 3)
					return { error: false, value: Array.from(out) };
				const text = decoder.decode(out);
				return {
					error: false,
					value: test.operation === 4 ? JSON.parse(text) : text,
				};
			},
		};
	}

	function typedHost(api, baseline = false) {
		return {
			invoke(test) {
				try {
					let value;
					if (baseline) {
						switch (test.operation) {
							case 1: {
								const packed = api.detect_pii(test.input, test.option);
								value = [];
								for (let i = 0; i < packed.length; i += 3)
									value.push({
										category: packed[i],
										start: packed[i + 1],
										end: packed[i + 2],
									});
								break;
							}
							case 2:
								value = api.sanitize_pii(test.input, test.option, false);
								break;
							// Existing browser decode is lossy text; verify its existing semantics separately.
							case 3:
								return null;
							case 4: {
								const result = JSON.parse(
									api.json_sample(test.input, test.option, BigInt(test.seed)),
								);
								value = {
									output: result.output,
									filtered_nulls: result.filtered.nulls,
									filtered_empty_arrays: result.filtered.emptyArrays,
									omitted_total: result.sampling.omittedTotal,
									arrays: result.sampling.arrays,
								};
								break;
							}
							case 5:
								if (test.option === 0 || test.option > 1024) return null;
								value = api.uuid_generate_v7(test.option);
								break;
							case 6:
								value = api.datetime_from_timestamp(
									BigInt(test.timestamp),
									"Iso",
								);
								break;
						}
					} else {
						const args = test.operation <= 4 ? [test.input] : [];
						if ([1, 2, 5].includes(test.operation)) args.push(test.option);
						if (test.operation === 4) args.push(test.option, BigInt(test.seed));
						if (test.operation === 6) args.push(BigInt(test.timestamp));
						value = api[names[test.operation]](...args);
						if (test.operation === 3) value = Array.from(value);
						if (test.operation === 4)
							value = {
								output: value.output,
								filtered_nulls: value.filteredNulls,
								filtered_empty_arrays: value.filteredEmptyArrays,
								omitted_total: value.omittedTotal,
								arrays: value.arrays,
							};
					}
					return { error: false, value };
				} catch (error) {
					return {
						error: true,
						value:
							typeof error === "string"
								? error.replace(/^Error: /, "")
								: (error.payload ?? error.message),
					};
				}
			},
		};
	}

	function verify(test, result) {
		if (result === null) return;
		assert(result.error === test.error, [test.name, result]);
		if (test.operation === 5 && !result.error) {
			const ids = result.value.split("\n");
			assert(
				ids.length === test.option && new Set(ids).size === ids.length,
				ids,
			);
			for (const id of ids) {
				assert(
					/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
						id,
					),
					id,
				);
				assert(
					Math.abs(
						Date.now() - parseInt(id.slice(0, 13).replaceAll("-", ""), 16),
					) < 5000,
					"UUID clock",
				);
			}
		} else {
			assert(
				JSON.stringify(canonical(result.value)) ===
					JSON.stringify(canonical(test.expected)),
				[test.name, test.operation, result.value, test.expected],
			);
		}
	}

	async function run() {
		const cases = await (await fetch("/build/cases.json")).json();
		const buffer = await bufferHost();
		let started = performance.now();
		const component = await import("/build/js/component.js");
		const componentLoad = performance.now() - started;
		started = performance.now();
		const baseline = await import("/build/baseline/strapd_wasm.js");
		await baseline.default();
		const baselineLoad = performance.now() - started;
		if (location.search) {
			const test = cases.find(
				(test) => test.operation === 6 && test.timestamp === "0",
			);
			return {
				timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
				buffer: buffer.invoke(test).value,
				component: component.timestamp(0n),
				existing_browser: baseline.datetime_from_timestamp(0n, "Iso"),
			};
		}
		const rows = ["engine,interface,fixture,bytes,operation,median_ms,p95_ms"];
		const hosts = {
			buffer,
			component: typedHost(component),
			"wasm-bindgen": typedHost(baseline, true),
		};
		for (const [kind, host] of Object.entries(hosts)) {
			for (const test of cases) verify(test, host.invoke(test));
			for (const test of cases.filter((test) =>
				/^(clean|dense)-/.test(test.name),
			)) {
				for (let i = 0; i < 20; i++) host.invoke(test);
				const samples = [];
				for (let i = 0; i < 101; i++) {
					started = performance.now();
					for (let repeat = 0; repeat < 10; repeat++) host.invoke(test);
					samples.push((performance.now() - started) / 10);
				}
				samples.sort((a, b) => a - b);
				rows.push(
					`chromium,${kind},${test.name.split("-")[0]},${encoder.encode(test.input).length},${test.operation},${samples[50].toFixed(6)},${samples[95].toFixed(6)}`,
				);
			}
			for (let repeat = 0; repeat < 10; repeat++)
				for (const test of cases) verify(test, host.invoke(test));
		}
		assert(
			buffer.invoke(cases[0], new Uint8Array([255])).error,
			"UTF-8 validation",
		);
		verify(cases[0], buffer.invoke(cases[0]));
		const large = cases.find((test) => test.name === "dense-65536-1");
		for (let i = 0; i < 100; i++) buffer.invoke(large);
		const memory = buffer.memory();
		for (let i = 0; i < 1000; i++) buffer.invoke(large);
		assert(buffer.memory() === memory, "memory grows on repeated calls");
		assert(
			baseline.base64_decode("/wCAaGk=") === "�\u0000�hi",
			"existing lossy decode semantics",
		);
		return {
			csv: rows.join("\n") + "\n",
			startup: {
				buffer: { ...buffer.startup, memory_bytes: memory },
				component: { load_compile_instantiate_ms: componentLoad },
				"wasm-bindgen": { load_compile_instantiate_ms: baselineLoad },
			},
			summary: `Browser: ${cases.length} oracle cases across buffer/component; existing browser behavior checked with explicit binary/count exceptions; reuse and recovery passed`,
		};
	}
	run()
		.then((result) => {
			window.pocFinished = result;
		})
		.catch((error) => {
			window.pocFinished = { error: error.stack ?? String(error) };
		});
}
