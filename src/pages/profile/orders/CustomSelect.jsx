import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Text,
  List,
  ListItem,
  useOutsideClick,
} from "@chakra-ui/react";

export default function CustomSelect({
  options = [],
  value,
  onChange,
  placeholder = "Filte by Status",
  className = "", // kept just in case you still pass something (not used in Chakra layout)
  width = "200px", // maps former Tailwind "w-50"
}) {
  const [open, setOpen] = useState(false);
  const [hoverIndex, setHoverIndex] = useState(-1);

  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value) || null,
    [options, value]
  );

  // Close on outside click (Chakra helper)
  useOutsideClick({
    ref: rootRef,
    handler: () => setOpen(false),
  });

  // Focus first item when opening with keyboard
  useEffect(() => {
    if (open) {
      setHoverIndex(Math.max(0, options.findIndex((o) => o.value === value)));
    }
  }, [open, options, value]);

  const commit = (opt) => {
    onChange?.(opt.value);
    setOpen(false);
    // return focus to button
    requestAnimationFrame(() => buttonRef.current?.focus());
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHoverIndex((i) => Math.min(options.length - 1, i + 1));
      listRef.current?.children?.[
        Math.min(options.length - 1, hoverIndex + 1)
      ]?.scrollIntoView({ block: "nearest" });
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHoverIndex((i) => Math.max(0, i - 1));
      listRef.current?.children?.[
        Math.max(0, hoverIndex - 1)
      ]?.scrollIntoView({ block: "nearest" });
    }
    if (e.key === "Home") {
      e.preventDefault();
      setHoverIndex(0);
      listRef.current?.children?.[0]?.scrollIntoView({ block: "nearest" });
    }
    if (e.key === "End") {
      e.preventDefault();
      setHoverIndex(options.length - 1);
      listRef.current?.children?.[
        options.length - 1
      ]?.scrollIntoView({ block: "nearest" });
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (hoverIndex >= 0 && hoverIndex < options.length)
        commit(options[hoverIndex]);
    }
  };

  return (
    <Box ref={rootRef} position="relative" w={width} onKeyDown={onKeyDown}>
      {/* Trigger */}
      <Button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        w="full"
        justifyContent="space-between"
        variant="outline"
        borderColor="#d2d2d2"
        bg="white"
        px={3}
        py={2}
        borderRadius="md"
        _focus={{ boxShadow: "none" }}
        _hover={{ boxShadow: "none", bg: "none" }}
      >
        <Text color={selectedOption ? "black" : "black"} fontSize="14px">
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Box
          as="svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          w={4}
          h={4}
          transition="transform 0.2s"
          transform={open ? "rotate(180deg)" : "rotate(0deg)"}
        >
          <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06z" />
        </Box>
      </Button>

      {/* List */}
      {open && (
        <Box
          ref={listRef}
          role="listbox"
          position="absolute"
          left={0}
          mt={1}
          maxH="14rem" 
          w="full"
          overflowY="auto"
          border="1px solid"
          borderColor="#d2d2d2"
          bg="white"
          boxShadow="md"
          zIndex={50}
          borderRadius="md"
          className="scroll-thin"
        >
          <List m={0} spacing={0}>
            {options.map((opt, idx) => {
              const isSelected = opt.value === selectedOption?.value;
              const isActive = idx === hoverIndex;
              return (
                <ListItem
                  key={opt.value ?? idx}
                  role="option"
                  aria-selected={isSelected}
                  px={3}
                  py={2}
                  cursor="pointer"
                  fontSize="14px"
                  bg={isActive ? "rgba(0,0,0,0.05)" : "white"}
                  fontWeight={isSelected ? "medium" : "normal"}
                  onMouseEnter={() => setHoverIndex(idx)}
                  onMouseDown={(e) => e.preventDefault()} // keep focus
                  onClick={() => commit(opt)}
                >
                  {opt.label}
                </ListItem>
              );
            })}
          </List>
        </Box>
      )}
    </Box>
  );
}
