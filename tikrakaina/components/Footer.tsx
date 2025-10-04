import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">VilRent</h3>
            <p className="text-sm">
              DI valdoma NT nuomos kainų analizė Vilniuje
            </p>
            <p className="text-sm mt-2">
              IĮ pažymos Nr. 1457545
            </p>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Teisinė informacija</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-sm hover:text-white transition-colors">
                  Naudojimosi sąlygos
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm hover:text-white transition-colors">
                  Privatumo politika
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Kontaktai</h3>
            <p className="text-sm">
              El. paštas:{' '}
              <a href="mailto:support@vilrent.lt" className="hover:text-white transition-colors">
                support@vilrent.lt
              </a>
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} VilRent. Visos teisės saugomos.</p>
        </div>
      </div>
    </footer>
  )
}
