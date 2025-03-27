import Image from "next/image";
import Link from "next/link";

const Navigation = () => {
  return (
    <nav className="bg-white shadow-md">
      <div>
        <div className="bg-blue-primary text-accent-primary flex flex-col md:flex-row justify-between items-start md:items-center px-10 py-2">
          {/* Left side navigation links */}
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-6 mb-4 md:mb-0">
            <Link href="#" className="hover:text-blue-600 font-medium">
              <Image
                src="https://cdn-ilcckdd.nitrocdn.com/zWDfZJLqRQmQVXoaKATzBZGWqfDqvOXo/assets/images/optimized/rev-45fe558/www.yas.sn/wp-content/uploads/2024/02/jem_logo.svg"
                alt="Yes Logo"
                width={50}
                height={50}
              />
            </Link>

            <Link href="#" className="mt-2 hover:text-blue-600 font-medium">
              A Propos
            </Link>
          </div>

          {/* Phone number */}
          <div className="mb-4 md:mb-0">
            <a
              href="tel:+221328240024"
              className=" hover:text-blue-600 font-medium"
            >
              +221 32 824 00 24
            </a>
          </div>
        </div>

        {/* Brand and secondary navigation */}
        <div className="bg-yellow-primary border-t">
          <div className="bg-yellow-primary flex flex-col md:flex-row justify-between items-start md:items-center flex"></div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
