import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator
} from "../ui/breadcrumb";
import { Link, useLocation } from "react-router-dom";

const MyBreadCrumb = () => {
  const location = useLocation();

  const segments = location.pathname
    .split("/")
    .filter(Boolean); // remove empty items

  let fullPath = "";

  return (
    <Breadcrumb className="my-2">
      <BreadcrumbList>
        {/* Home Link */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />

        {segments.map((segment, index) => {
          fullPath += `/${segment}`;

          return (
            <>
            <BreadcrumbItem key={index}>
              <BreadcrumbLink asChild key={index}>
                <Link to={fullPath} key={index}>
                  {segment
                    .replace("-", " ")        
                    .replace(/\b\w/g, c => c.toUpperCase())}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default MyBreadCrumb;
