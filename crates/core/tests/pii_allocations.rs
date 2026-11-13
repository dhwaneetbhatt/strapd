use std::{
    alloc::{GlobalAlloc, Layout, System},
    borrow::Cow,
    cell::Cell,
};
use strapd_core::sanitize::pii::{Categories, Mode, detect, sanitize};

struct CountingAllocator;
thread_local! { static ALLOCATIONS: Cell<usize> = const { Cell::new(0) }; }

unsafe impl GlobalAlloc for CountingAllocator {
    unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
        ALLOCATIONS.with(|count| count.set(count.get() + 1));
        // SAFETY: forward the allocator's original layout unchanged.
        unsafe { System.alloc(layout) }
    }
    unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
        // SAFETY: forward the allocator's original pointer and layout unchanged.
        unsafe { System.dealloc(ptr, layout) }
    }
    unsafe fn realloc(&self, ptr: *mut u8, layout: Layout, size: usize) -> *mut u8 {
        ALLOCATIONS.with(|count| count.set(count.get() + 1));
        // SAFETY: forward the allocator's original arguments unchanged.
        unsafe { System.realloc(ptr, layout, size) }
    }
}

#[global_allocator]
static ALLOCATOR: CountingAllocator = CountingAllocator;

#[test]
fn clean_detection_and_both_sanitizer_modes_do_not_allocate() {
    let clean =
        "status=ready route=/health trace=opaque_value action=read success=true\n".repeat(1000);
    for input in ["", clean.as_str(), "ordinary भारत 🙂", "1699999999999"] {
        ALLOCATIONS.with(|count| count.set(0));
        let matches = detect(input, Categories::ALL);
        let masked = sanitize(input, Categories::ALL, Mode::Mask);
        let pseudonyms = sanitize(input, Categories::ALL, Mode::Pseudonymize);
        let allocations = ALLOCATIONS.with(Cell::get);
        assert_eq!(allocations, 0);
        assert!(matches.is_empty());
        assert!(matches!(masked, Cow::Borrowed(_)));
        assert!(matches!(pseudonyms, Cow::Borrowed(_)));
    }
}
