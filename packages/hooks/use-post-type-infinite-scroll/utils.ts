import { isArchive, isRedirection } from "@frontity/source";
import { State } from "frontity/types";
import { Packages } from "../use-infinite-scroll/types";

/**
 * Arguments passed to {@link getLinksFromPages}.
 */
type GetLinksFromPagesParams = {
  /**
   * List of links pointing to archive pages.
   *
   * @example ["/blog/", "/blog/page/2/", "/blog/page/3/"]
   */
  pages: string[];

  /**
   * The first link showed by the infinite scroll hook. The link is removed from
   * the second and subsequent pages if it's not included in the first one, in
   * order to avoid showing it twice.
   *
   * @example "/blog/first-post/"
   */
  firstLink: string;

  /**
   * The Frontity state object.
   */
  state: State<Packages>;
};

/**
 * Get all the item links from the given pages, removing redirections.
 *
 * @param params - Object of type {@link GetLinksFromPagesParams}.
 * @returns List of item links.
 */
export const getLinksFromPages = ({
  pages,
  firstLink,
  state,
}: GetLinksFromPagesParams): string[] => {
  // Get the data object of all ready pages.
  const pagesData = pages
    .map((link) => state.source.get(link))
    .filter((data) => isArchive(data) && data.isReady);

  // Get all the post links from the pages.
  const rawLinks = pagesData.reduce((allLinks, data, index) => {
    if (isArchive(data)) {
      let dataLinks = data.items.map(({ link }) => link);
      // Filter out `firstLink` if the archive page is not the first one.
      if (index > 0) dataLinks = dataLinks.filter((link) => link !== firstLink);
      allLinks = allLinks.concat(dataLinks);
    }
    return allLinks;
  }, [] as string[]);

  // Remove links that point to redirections.
  return rawLinks
    .map((link) => state.source.get(link))
    .filter((data) => !isRedirection(data))
    .map(({ link }) => link);
};