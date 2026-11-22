These unambiguous unified patches were captured once with:

```sh
diff -u --label a --label b NAME.from NAME.to > NAME.patch
```

The capture host provided **Apple diff (based on FreeBSD diff)**, not GNU
diffutils. The fixtures exercise the common GNU-compatible unified format,
including CRLF bytes and missing-final-newline markers. Tests read the committed
bytes and never invoke an external diff process.
