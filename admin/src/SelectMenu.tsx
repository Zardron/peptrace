import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export type SelectMenuOption<Value extends string> = {
  description?: string;
  label: string;
  value: Value;
};

export function SelectMenu<Value extends string>({
  ariaLabel,
  onChange,
  options,
  value
}: {
  ariaLabel: string;
  onChange: (value: Value) => void;
  options: Array<SelectMenuOption<Value>>;
  value: Value;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, options.findIndex((option) => option.value === value)));
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!isOpen) return;
    const selectedIndex = options.findIndex((option) => option.value === value);
    setActiveIndex(Math.max(0, selectedIndex));

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, value]);

  const selectOption = (option: SelectMenuOption<Value>) => {
    onChange(option.value);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      menuRef.current?.querySelector<HTMLButtonElement>(".select-menu-trigger")?.focus();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      setActiveIndex((current) =>
        event.key === "ArrowDown"
          ? (current + 1) % options.length
          : (current - 1 + options.length) % options.length
      );
      return;
    }
    if (isOpen && event.key === "Enter") {
      event.preventDefault();
      const option = options[activeIndex];
      if (option) selectOption(option);
    }
  };

  return (
    <div className="select-menu" onKeyDown={handleKeyDown} ref={menuRef}>
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className="select-menu-trigger"
        data-open={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span>{selectedOption?.label ?? value}</span>
        <ChevronDown aria-hidden="true" size={17} strokeWidth={2} />
      </button>

      {isOpen && (
        <div aria-label={ariaLabel} className="select-menu-popover" id={menuId} role="listbox">
          {options.map((option, index) => (
            <button
              aria-selected={option.value === value}
              className="select-menu-option"
              data-active={index === activeIndex}
              key={option.value}
              onClick={() => selectOption(option)}
              onMouseEnter={() => setActiveIndex(index)}
              role="option"
              tabIndex={-1}
              type="button"
            >
              <span className="select-menu-check" aria-hidden="true">
                {option.value === value && <Check size={15} strokeWidth={2.4} />}
              </span>
              <span className="select-menu-copy">
                <strong>{option.label}</strong>
                {option.description && <small>{option.description}</small>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
