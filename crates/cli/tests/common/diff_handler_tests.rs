use super::auto_color;
use std::ffi::OsStr;

#[test]
fn auto_color_requires_a_terminal_and_no_nonempty_opt_out() {
    for is_terminal in [false, true] {
        assert_eq!(auto_color(is_terminal, None), is_terminal);
        assert_eq!(auto_color(is_terminal, Some(OsStr::new(""))), is_terminal);
        assert!(!auto_color(is_terminal, Some(OsStr::new("1"))));
    }
}
