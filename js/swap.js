var titleSearch = "art occult";

const titleSearch = fetch(
  `https://www.googleapis.com/books/v1/volumes?q=intitle:${titleSearch}&key=AIzaSyDz7RLi3HFqoAlJVKOOK6e3kIOMdGTR8Gg`
);
fetchPromise
  .then((response) => {
    return response.json();
  })
  .then((x) => {
    console.log(x.items);
    x.items.forEach((i) => {
      if (typeof i.volumeInfo.authors !== "undefined") {
        console.log(i.volumeInfo.authors[0]);
      } else {
      }
    });
  });
