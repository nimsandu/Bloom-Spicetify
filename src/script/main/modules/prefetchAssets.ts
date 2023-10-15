import { githubPagesURL } from "../../shared/constants/constants";
import { githubContentsAPIAssetsURL } from "../constants/constants";

declare type GitHubContentsAPIItem = {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: "file" | "dir";
  _links: {
    self: string;
    git: string;
    html: string;
  };
};


function prefetchFile(fileLink: string): void {
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.as = "image";
  link.href = fileLink;
  document.head.appendChild(link);
}

async function processDirectory(directoryLink: string): Promise<void> {
  try {
    const response = await fetch(directoryLink);
    const items = await response.json();
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    items.forEach(processItem);
  } catch {
    // nothing
  }
}

async function processItem(item: GitHubContentsAPIItem): Promise<void> {
  switch (item.type) {
    case "file":
      prefetchFile(`${githubPagesURL}/${item.path}`);
      break;

    case "dir":
      // eslint-disable-next-line no-underscore-dangle
      processDirectory(item._links.self);
      break;

    default:
      break;
  }
}

function prefetchAssets(): void {
  processDirectory(githubContentsAPIAssetsURL);
}

export default prefetchAssets;
