# Sanitize secrets

Redact recognizable credentials before sharing logs, configuration, headers, or
developer text. The CLI, WebApp, and Pipes use the same Rust implementation.
Processing is local and offline; credentials are never verified with a provider.

All categories are enabled by default. `--all` makes that choice explicit.
Supplying category flags enables **only their union**. Combining `--all` with a
category flag is an error. `strapd redact secrets` and `strapd sanitize redact`
are aliases. Positional text takes precedence over stdin, including an explicit
empty argument. Input whitespace is preserved; the CLI appends its usual final
newline.

## Categories

| Flag | Recognized material | Placeholder |
| --- | --- | --- |
| `--api-keys` | Labeled API/access keys, AWS access-key components, distinctive provider credentials | `[REDACTED_API_KEY]` |
| `--auth` | Authorization and Proxy-Authorization credentials, including Digest and AWS parameters | `[REDACTED_AUTH]` |
| `--cookies` | Every request Cookie value; first value of each Set-Cookie field | `[REDACTED_COOKIE]` |
| `--databases` | Database URL usernames/passwords and supported connection-string credentials | `[REDACTED_DATABASE]` |
| `--crypto-keys` | Private-key blocks, age identities, private JWK members, labeled encryption/signing/HMAC keys and webhook secrets | `[REDACTED_CRYPTO_KEY]` |
| `--passwords` | Labeled passwords, passphrases, passwd and pwd values | `[REDACTED_PASSWORD]` |
| `--tokens` | Labeled access/refresh/ID/session/auth tokens, client/application secrets, and scoped secret fields; compact JWS/JWE | `[REDACTED_TOKEN]` |
| `--signed-urls` | AWS signed URL credentials/signatures/session tokens and contextual Azure SAS signatures | `[REDACTED_SIGNED_URL]` |

Rules can overlap. With only API keys enabled, a distinctive provider key inside
an Authorization header is still an API key; an opaque Bearer value stays intact.
Existing placeholders are stable, and sanitizing the result again is a no-op.

## Pattern coverage

Field labels accept snake case, kebab case, camel case, uppercase, and semantic
provider prefixes: `apiKey`, `API_KEY`, `X-API-Key`, and `OPENAI_API_KEY`.
Explicitly labeled secrets are masked even when short. Metadata such as
`api_key_id`, `token_count`, `password_length`, `private_key_path`, and
`public_key` is preserved. Unlabeled ordinary usernames, arbitrary hexadecimal
strings, and arbitrary base64 strings are preserved.

Dotted configuration names use the same rules: `storage.accessKey` is an API
key, `webhookSecret` is a cryptographic signing secret, and `appSecret` or
`storage.secret` belongs to tokens. Selecting API keys alone leaves those token
and cryptographic fields visible. Salt values and key-version metadata are
preserved; matching does not infer secrets from how random a value looks.

Provider recognition uses distinctive prefixes, compatible characters, plausible
minimum sizes, and whole candidate boundaries. It includes GitHub personal,
OAuth, user, refresh, and JWT-shaped installation tokens; default GitLab token
families and routable tails; Slack bot/user/app/rotating/workflow tokens; Stripe
secret/restricted/organization/webhook keys; OpenAI project/service-account/admin
and distinctive legacy keys; Anthropic, npm, SendGrid, Google, and AWS IDs.
Custom GitLab prefixes and other opaque keys require a recognized label or
container. Standalone Stripe `pk_live_`/`pk_test_` publishable keys are preserved.
Google `AIza` keys are conservatively redacted: their permissions, including
whether they belong to public Firebase configuration, cannot be inferred locally.

Authorization schemes and header names remain visible. Cookie names, separators,
and quoted delimiters remain visible. Set-Cookie attributes, including commas in
Expires dates, remain intact. Raw headers, quoted curl headers, and JSON header
values are supported.

Database schemes include postgres/postgresql, mysql/mariadb, mongodb(+srv),
redis/rediss, and sqlserver/mssql, with applicable SQLAlchemy driver suffixes.
Userinfo and credential query parameters are masked without normalizing hosts,
ports, database names, or percent encoding elsewhere. Common PostgreSQL/libpq,
JDBC, and SQL Server connection strings support quoted/backslash values or SQL
Server braces with doubled closing braces. Specialized Oracle descriptors and
Go driver DSNs are outside the initial grammar.

Private blocks include PKCS#8, encrypted PKCS#8, RSA, EC, DSA, OpenSSH, and PGP
private-key markers, including escaped newlines in JSON strings. Both ordinary
and PQ age secret identities are recognized. JWK detection requires local `kty`
context: RSA private parameters and other primes, EC/OKP `d`, and symmetric `k`
are masked; public parameters and metadata remain. Duplicate private members are
handled without reserializing the document. Recognized truncated containers are
conservatively masked through their enclosing value or the input end.

Compact JWS/JWE detection checks the protected-header JSON and segment structure.
Expired tokens and unsigned JWS remain sensitive. Detection does not verify a
signature, expiration, or algorithm. Signed URL rules preserve resource and
expiration parameters, recognize percent-encoded parameter names, and require
AWS or Azure signing context before masking generic signature parameters.

## WebApp and Pipes

Find **Sanitize Secrets** under Security. All eight categories start enabled;
turning them all off preserves the input. The output is read-only and can be
copied. Reset clears the text and restores the default selection. Raw input is
excluded from shareable tool URLs.

In Pipes, add **Sanitize Secrets** as a transform. Category settings are frozen
in saved and exported definitions, while runtime input and output are excluded.
An API-only pipe stays API-only after save, reload, export, and import.

## Limits

Finite deterministic rules cannot identify every secret. Opaque unlabeled values,
credentials hidden inside arbitrary encodings, binary data, unsupported formats,
and future provider formats can remain visible. Matching does not establish
whether a credential is real, valid, expired, or privileged. Review the result
before sharing sensitive material. Selecting fewer categories intentionally
leaves other material visible.

Labeled-field matching covers inline scalar values. It does not parse complete
YAML documents or arbitrary JSON objects as secret values. YAML block scalars
need a recognizable provider credential or private-key marker; contextual JWK
objects use their separate cryptographic rules.

## Sources behind the grammars

- [HTTP authentication](https://www.rfc-editor.org/rfc/rfc9110.html#name-authentication)
- [HTTP cookies](https://www.rfc-editor.org/rfc/rfc6265.html)
- [JSON Web Keys](https://www.rfc-editor.org/rfc/rfc7517.html) and [private JWK parameters](https://www.rfc-editor.org/rfc/rfc7518.html)
- [JWS](https://www.rfc-editor.org/rfc/rfc7515.html) and [JWE](https://www.rfc-editor.org/rfc/rfc7516.html)
- [PostgreSQL connection strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
- [SQLAlchemy engine URLs](https://docs.sqlalchemy.org/en/20/core/engines.html)
- [AWS presigned URL authentication](https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-query-string-auth.html)
- [Azure SAS](https://learn.microsoft.com/en-us/rest/api/storageservices/create-service-sas)
- [GitHub token prefixes](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-authentication-to-github)
- [GitLab token families](https://docs.gitlab.com/security/tokens/)
- [Slack token types](https://docs.slack.dev/authentication/tokens/)
- [Stripe secret and publishable keys](https://docs.stripe.com/keys)
- [Application access keys and secrets](https://www.100ms.live/docs/get-started/v2/get-started/security-and-tokens)
- [Non-secret salts in HKDF](https://www.rfc-editor.org/rfc/rfc5869.html#section-3.1)

See the [verification report](../openspec/changes/archive/2026-10-12-gh-33-sanitize-secrets/verification.md)
for measured latency and native/WASM parity evidence. A maintained benchmark
suite is outside this change's scope.
