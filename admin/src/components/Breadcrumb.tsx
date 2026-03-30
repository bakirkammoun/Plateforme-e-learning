import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  link: string;
}

interface BreadcrumbProps {
  pageName?: string;
  items?: BreadcrumbItem[];
}

const Breadcrumb = ({ pageName, items }: BreadcrumbProps) => {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-title-md2 font-semibold text-black dark:text-white">
        {pageName || (items && items[items.length - 1]?.label)}
      </h2>

      <nav>
        <ol className="flex items-center gap-2">
          {items ? (
            items.map((item, index) => (
              <li key={item.link} className="flex items-center gap-2">
                <Link 
                  to={item.link}
                  className={index === items.length - 1 ? 'text-primary' : 'text-gray-700 hover:text-primary'}
                >
                  {item.label}
                </Link>
                {index < items.length - 1 && (
                  <span className="text-gray-500">/</span>
                )}
              </li>
            ))
          ) : (
            <>
              <li>
                <Link to="/dashboard">Dashboard /</Link>
              </li>
              <li className="text-primary">{pageName}</li>
            </>
          )}
        </ol>
      </nav>
    </div>
  );
};

export default Breadcrumb; 