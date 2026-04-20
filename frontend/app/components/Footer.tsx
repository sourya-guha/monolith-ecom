import React from 'react';
import Link from 'next/link';

export const Footer = () => {
  const columns = [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '#' },
        { label: 'Pricing', href: '#' },
        { label: 'Security', href: '#' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Careers', href: '#' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Documentation', href: '#' },
        { label: 'Support', href: '#' },
        { label: 'Contact', href: '#' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy', href: '#' },
        { label: 'Terms', href: '#' },
        { label: 'Cookies', href: '#' },
      ],
    },
  ];

  return (
    <footer className="relative w-full bg-[#0a0a0f] border-t border-white/[0.06] mt-0">
      {/* Gradient divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#7c3aed]/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Top section: Logo + Newsletter */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12">
          <div className="max-w-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] flex items-center justify-center">
                <span className="text-white font-bold text-sm">X</span>
              </div>
              <span className="text-lg font-bold gradient-text">PROJECT-X</span>
            </div>
            <p className="text-sm text-[#64748b] leading-relaxed">
              The next‑generation marketplace connecting buyers with trusted sellers worldwide.
            </p>
          </div>

          {/* Newsletter */}
          <div className="w-full lg:w-auto">
            <p className="text-sm font-semibold text-white mb-3">Stay updated</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="input-dark text-sm py-2.5 px-4 w-full lg:w-64"
              />
              <button className="btn-gradient text-sm py-2.5 px-5 whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-white mb-4 tracking-wide">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#64748b] hover:text-[#c084fc] transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[#64748b]">
            &copy; {new Date().getFullYear()} PROJECT-X. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {['GitHub', 'Twitter', 'Discord'].map((s) => (
              <a
                key={s}
                href="#"
                className="text-xs text-[#64748b] hover:text-[#c084fc] transition-colors duration-200"
              >
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};