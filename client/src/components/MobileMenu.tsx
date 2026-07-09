import { useEffect } from "react";
import { createPortal } from "react-dom";
import { NavLink } from "react-router-dom";

type NavLinkItem = { to: string; label: string };

type MobileMenuProps = {
  links: NavLinkItem[];
  isOpen: boolean;
  onClose: () => void;
};

const MobileMenu = ({ links, isOpen, onClose }: MobileMenuProps) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-30 md:hidden ">
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <nav
        aria-label="Mobile"
        className="absolute right-0 top-0 flex h-full w-72 max-w-[80%] flex-col gap-1 border-l border-zinc-800 bg-zinc-950 p-4 shadow-2xl "
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Menu
          </span>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-100"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-5 w-5"
            >
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            onClick={onClose}
            className={({ isActive }) =>
              [
                "rounded-xl px-4 py-3 text-base font-medium transition-colors",
                isActive
                  ? "bg-lime-400 text-zinc-950"
                  : "text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100",
              ].join(" ")
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </div>,
    document.body,
  );
};

export default MobileMenu;
