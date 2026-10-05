import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// Tira acentos e ignora maiusculas/minusculas para comparar.
function normalize(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

// Lista com busca: clica, digita parte do nome e a lista filtra na hora.
// Todas as palavras digitadas precisam aparecer no item, em qualquer ordem.
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Selecione",
  disabled,
  className = "",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const keyboardRef = useRef(false);

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(() => {
    const words = normalize(query).split(/\s+/).filter(Boolean);
    if (words.length === 0) return options;
    return options.filter((o) => {
      const label = normalize(o.label);
      return words.every((w) => label.includes(w));
    });
  }, [options, query]);

  // Fecha a lista ao clicar fora dela.
  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  // Ao navegar pelo teclado, mantem o item destacado visivel.
  useEffect(() => {
    if (open && keyboardRef.current) {
      const el = listRef.current?.querySelector('[data-highlighted="true"]');
      el?.scrollIntoView({ block: "nearest" });
      keyboardRef.current = false;
    }
  }, [highlight, open]);

  function openList() {
    if (disabled || open) return;
    setOpen(true);
    setQuery("");
    setHighlight(0);
  }

  function choose(newValue: string) {
    onChange(newValue);
    setOpen(false);
    setQuery("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      openList();
      keyboardRef.current = true;
      setHighlight((h) => Math.min(h + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      keyboardRef.current = true;
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      // Evita enviar o formulario sem querer enquanto a lista esta aberta.
      if (open) {
        e.preventDefault();
        const item = filtered[highlight];
        if (item) choose(item.value);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
      }
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        type="text"
        autoComplete="off"
        disabled={disabled}
        value={open ? query : selected?.label ?? ""}
        placeholder={open ? selected?.label ?? "Digite para buscar..." : placeholder}
        onFocus={openList}
        onClick={openList}
        onChange={(e) => {
          setQuery(e.target.value);
          setHighlight(0);
          if (!open) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        className="h-11 w-full truncate rounded border border-line bg-white pl-3 pr-9 text-sm placeholder:text-muted focus:border-accent disabled:bg-surface disabled:text-muted"
      />
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>

      {open && (
        <ul
          ref={listRef}
          className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded border border-line bg-white py-1 shadow-lg"
        >
          {value && query === "" && (
            <li
              onMouseDown={(e) => {
                e.preventDefault();
                choose("");
              }}
              className="cursor-pointer px-3 py-2 text-sm text-steel hover:bg-surface"
            >
              Limpar selecao
            </li>
          )}
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted">Nenhum item encontrado</li>
          ) : (
            filtered.map((o, i) => (
              <li
                key={o.value}
                data-highlighted={i === highlight}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(o.value);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={`cursor-pointer px-3 py-2 text-sm text-ink ${i === highlight ? "bg-accent-soft" : ""} ${
                  o.value === value ? "font-semibold" : ""
                }`}
              >
                {o.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
