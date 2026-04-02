import { PaginationEllipsis, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { useMediaQuery } from "react-responsive";

export const generatePaginationLinks = (
  currentPage: number,
  totalPages: number,
  showPages:number,
  onPageChange: (page: number) => void
) => {
  const isBigScreen = useMediaQuery({ query: '(min-width: 1824px)' })
  const isPortrait = useMediaQuery({ query: '(min-width: 1224px)' })
  const isTablet = useMediaQuery({ query: '(min-width: 746px)' })
  //const isMobile = useMediaQuery({ query: '(min-width: 400px)' })

  const pages: JSX.Element[] = [];
  if (totalPages <= showPages) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <PaginationItem key={i}                  
        >
          <PaginationLink
            onClick={() => onPageChange(i)}
            isActive={i === currentPage}
            className="hover:cursor-pointer hover:bg-gray-200 rounded"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
  } else {
    if (currentPage > showPages - 1){
        pages.push(<PaginationEllipsis className={(isBigScreen || isPortrait ? 'h-9 w-9' : isTablet ? 'h-5 w-5 ' : 'h-3 w-3')} />);
    }
    for (let i = currentPage; i <= ((currentPage < totalPages -1) ? currentPage + showPages - 1 : totalPages); i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => onPageChange(i)}
            isActive={i === currentPage}
            className="hover:cursor-pointer hover:bg-gray-200 rounded"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
      
    }
    if (currentPage < totalPages - 1){
       pages.push(<PaginationEllipsis />);
    }
  }
  return pages;
};