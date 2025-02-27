import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';

export default function HeaderMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const handleNavigation = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(path);
    setMenuOpen(false);
  };

  return (
    <div className="fixed top-4 left-4 z-10">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="p-2 hover:text-blue-700 focus:outline-none"
      >
        <Menu size={24} />
      </button>
      {menuOpen && (
        <div className="mt-2 bg-white shadow-md rounded-md py-2">
          <a 
            href="#"
            onClick={handleNavigation('/main')}
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            首頁
          </a>
          <a 
            href="#"
            onClick={handleNavigation('/announcement')}
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            公告
          </a>
          <a 
            href="#"
            onClick={handleNavigation('/package')}
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Package
          </a>
          <a 
            href="https://forms.gle/wsHwLjfar88Tz5yb6"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            錯誤回報
          </a>
        </div>
      )}
    </div>
  );
}