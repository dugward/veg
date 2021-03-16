//push initial state
history.pushState(null, null, null);
let pageState = 0;
window.addEventListener("popstate", function () {
  if (pageState == 1) {
    location.reload();
  } else if (pageState == 2) {
    usersMenuUp();
  }
});

//fire up firebase
var firebaseConfig = {
  apiKey: "AIzaSyApyJTj2_WdTPj_0zsrehaLn3sU2X_9Frk",
  authDomain: "cultural-veg.firebaseapp.com",
  projectId: "cultural-veg",
  storageBucket: "cultural-veg.appspot.com",
  messagingSenderId: "1050082770027",
  appId: "1:1050082770027:web:445a2c6e94ed8e1ea3452e",
  measurementId: "G-3S2PN48GQS",
};

firebase.initializeApp(firebaseConfig);
firebase.analytics();
var db = firebase.firestore();
var provider = new firebase.auth.GoogleAuthProvider();

//The login button
const loginButton = document.getElementById("loginButton");
loginButton.addEventListener("click", () => {
  firebase.auth().signInWithRedirect(provider);
});

//The logout button
document.getElementById("logout").addEventListener("click", () => {
  firebase.auth().signOut();
});

// Buckets to fill
var userInfo, userID, userName, userDoc, userbooks, unfinished;

//Signin and Signout functions
firebase.auth().onAuthStateChanged(function (user) {
  //ui changes
  const logout = document.getElementById("logout");
  const allButHeader = document.getElementById("allButHeader");
  logout.style.display = "block";
  loginButton.style.display = "none";
  allButHeader.style.display = "block";
  //grab some user info
  if (user) {
    userInfo = firebase.auth().currentUser;
    userID = userInfo.uid;
    userName = userInfo.displayName;

    console.log(`${userName} signed in`);

    //check if user doc exists
    userDoc = db.collection("users").doc(userID);
    userDoc.get().then(function (doc) {
      if (doc.exists) {
        unfinished = doc.data().unfinished;
        userbooks = doc.data().books;
      } else {
        //create user doc if not there
        db.collection("users").doc(userID).set({
          name: userName,
          books: [],
          finished: 0,
        });
      }
    });
    //ui changes if logged off
  } else {
    console.log("Signed out");
    logout.style.display = "none";
    loginButton.style.display = "block";
    allButHeader.style.display = "none";
  }
});

//Menu items UI changes
const entryMenu = document.getElementById("entryMenu");
const logMenu = document.getElementById("logMenu");
// const statsMenu = document.getElementById("statsMenu");
const usersMenu = document.getElementById("usersMenu");
const formDiv = document.getElementById("formDiv");
const confirmDiv = document.getElementById("confirm");
const errorDiv = document.getElementById("error");
const logDiv = document.getElementsByClassName("log")[0];
const loggedDiv = document.getElementById("logged");
// const statsDiv = document.getElementsByClassName("stats")[0];
const usersDiv = document.getElementsByClassName("users")[0];
//
function clearActive() {
  const menuItems = document.getElementsByClassName("menuitem");
  for (let i = 0; i < menuItems.length; i++) {
    menuItems[i].classList.remove("active");
  }
}

entryMenu.addEventListener("click", () => {
  location.reload();
});

logMenu.addEventListener("click", () => {
  if (logMenu.classList.contains("active") == false) {
    clearActive();
    pageState = 1;
    var book;
    logDiv.innerHTML = "";
    logMenu.classList.add("active");
    formDiv.style.display = "none";
    logDiv.style.display = "block";
    errorDiv.style.display = "none";
    loggedDiv.style.display = "none";
    confirmDiv.style.display = "none";
    // statsDiv.style.display = "none";
    usersDiv.style.display = "none";
    history.pushState(null, null, null);
    console.log(userbooks);
    var counter = 2;
    userDoc = db.collection("users").doc(userID);
    userDoc.get().then(function (doc) {
      userbooks = doc.data().books;
    });
    userbooks.forEach((el) => {
      const bookDoc = db.collection("books").doc(el);
      bookDoc.get().then(function (doc) {
        book = doc.data();
        if (doc.data().finished == 0) {
          logDiv.insertAdjacentHTML(
            "afterbegin",
            `
        <div class="logItem ${doc.id}">
      <span class="lognum">${counter}.</span>
      <img src="${doc.data().imageUrl}">
      <a href="${doc.data().webLink}">${
              doc.data().title
            }</a></br><span class="authorlist">${
              doc.data().author
            }</span></br><div class="little"><span class="dueDone ${
              doc.id
            }">Due</span
      ><span class="date ${doc.id}">${doc.data().due}</span>
      <span class="material-icons box unchecked ${
        doc.id
      }"> check_box_outline_blank </span>
      <span class="material-icons box checked ${
        doc.id
      }"> check_box_outline</span></br>
<span class="material-icons remove ${doc.id}">
remove_circle_outline
</span>
<!-- <a class="add ${doc.id}">Add time</a>-->
</div>
    </div>
        `
          );
          //add event listener for checkbox
          document
            .getElementsByClassName(`unchecked`)[0]
            .addEventListener("click", () => {
              document.getElementsByClassName(
                `unchecked ${doc.id}`
              )[0].style.display = "none";
              // document.getElementsByClassName(
              //   `add ${doc.id}`
              // )[0].style.display = "none";
              document.getElementsByClassName(
                `dueDone ${doc.id}`
              )[0].innerText = "Done";
              document.getElementsByClassName(
                `date ${doc.id}`
              )[0].style.display = "none";
              document.getElementsByClassName(
                `checked ${doc.id}`
              )[0].style.display = "inline";
              userDoc.update({
                unfinished: firebase.firestore.FieldValue.increment(-1),
              });
              bookDoc.update({
                finished: 1,
              });
            });

          // remove entry

          let thisRemove = document.getElementsByClassName(
            `remove ${doc.id}`
          )[0];
          thisRemove.addEventListener("click", () => {
            let warning = document.querySelector(".warning");
            warning.innerHTML = `  <p class="warningQuestion">Remove book?</p>
            <p class="warningoptions"><span class="yes">Yes</span>/<span class="no">No</span></p>`;
            warning.style.display = "block";
            document.querySelector(".yes").addEventListener("click", () => {
              let deleteId = thisRemove.classList[2];
              //delete doc in books and user
              db.collection("books").doc(deleteId).delete();
              db.collection("users")
                .doc(userID)
                .update({
                  books: firebase.firestore.FieldValue.arrayRemove(
                    `${deleteId}`
                  ),
                });
              userDoc.update({
                unfinished: firebase.firestore.FieldValue.increment(-1),
              });
              //remove from page
              document.getElementsByClassName(
                `logItem ${deleteId}`
              )[0].style.display = "none";
              //close warning
              warning.style.display = "none";
              warning.innerHTML = ``;
            });
            document.querySelector(".no").addEventListener("click", () => {
              warning.style.display = "none";
              warning.innerHTML = ``;
            });
          });

          // Add Time

          // let thisAdd = document.getElementsByClassName(`add ${doc.id}`)[0];
          // console.log(thisAdd);
          // thisAdd.addEventListener("click", () => {
          //   let addId = thisAdd.classList[1];
          //   console.log(addId);
          //   userDoc = db.collection("books").doc(addId);
          //   var nowDue;
          //   userDoc.get().then(function (doc) {
          //     let currentDue = new Date(doc.data().due);
          //     console.log(currentDue);
          //     let newDue = new Date();
          //     newDue.setDate(currentDue.getDate() + 7);
          //     nowDue = newDue.toLocaleDateString();
          //     console.log(nowDue);
          //     userDoc.update({
          //       due: `${nowDue}`,
          //     });
          //     console.log(addId);
          //     console.log(document.querySelector(`.date.${addId}`));
          //     document.querySelector(`.date.${doc.id}`).innerText = `${nowDue}`;
          //   });
          // });

          //
        } else {
          logDiv.insertAdjacentHTML(
            "beforeend",
            `
        <div class="logItem ${doc.id}">
      <span class="lognum">${counter}.</span>
      <img src="${doc.data().imageUrl}">
      <a href="${doc.data().webLink}">${
              doc.data().title
            }</a></br><span class="authorlist">${doc.data().author}</span></br>
           <div class="little"> <span class="material-icons remove ${doc.id}">
            remove_circle_outline
            </span><span class="dueDone">Done</span
      ></div>
    </div>
        `
          );
          //remove entry
          let thisRemove = document.getElementsByClassName(
            `remove ${doc.id}`
          )[0];
          thisRemove.addEventListener("click", () => {
            let warning = document.querySelector(".warning");
            warning.innerHTML = `  <p class="warningQuestion">Remove book?</p>
            <p class="warningoptions"><span class="yes">Yes</span>/<span class="no">No</span></p>`;
            warning.style.display = "block";
            document.querySelector(".yes").addEventListener("click", () => {
              let deleteId = thisRemove.classList[2];
              //delete doc in books and user
              db.collection("books").doc(deleteId).delete();
              db.collection("users")
                .doc(userID)
                .update({
                  books: firebase.firestore.FieldValue.arrayRemove(
                    `${deleteId}`
                  ),
                });
              //remove from page
              document.getElementsByClassName(
                `logItem ${deleteId}`
              )[0].style.display = "none";
              //close warning
              warning.style.display = "none";
              warning.innerHTML = ``;
            });
            document.querySelector(".no").addEventListener("click", () => {
              warning.style.display = "none";
              warning.innerHTML = ``;
            });
          });
        }

        counter++;
      });
    });
  }
});

// statsMenu.addEventListener("click", () => {
//   if (statsMenu.classList.contains("active") == false) {
//     clearActive();
//     pageState = 1;
//     statsMenu.classList.add("active");
//     formDiv.style.display = "none";
//     logDiv.style.display = "none";
//     statsDiv.style.display = "block";
//     usersDiv.style.display = "none";
//     history.pushState(null, null, null);
//   }
// });
function usersMenuUp() {
  if (usersMenu.classList.contains("active") == false) {
    clearActive();
    pageState = 1;
    usersMenu.classList.add("active");
    formDiv.style.display = "none";
    logDiv.style.display = "none";
    // statsDiv.style.display = "none";
    usersDiv.style.display = "block";
    history.pushState(null, null, null);
    var counter = 2;
    usersDiv.innerHTML = "";
    logDiv.innerHTML = "";
    db.collection("users")
      .get()
      .then(function (users) {
        users.forEach(function (doc) {
          document.getElementById("userRow").insertAdjacentHTML(
            "beforeend",
            `<div class="userchoicerow">
          <span class="rowNum">${counter}.</span
          ><a class="userchoice dotted">${doc.data().name}</a>
        </div>`
          );
          counter++;

          //add event listener
          var userChoice = document.getElementsByClassName("userchoice");
          var thisUserChoice = userChoice[userChoice.length - 1];
          thisUserChoice.addEventListener("click", () => {
            usersMenu.classList.remove("active");
            pageState = 2;
            var count = 2;
            var username = thisUserChoice.innerText;
            console.log(username);
            logDiv.insertAdjacentHTML(
              "beforeend",
              `<div class="userchoicerow" style="margin-bottom:.5em">
              <span class="rowNum">2.</span
              ><a class="userchoice dotted">${username}</a>
            </div>`
            );
            var userBooks = db
              .collection("users")
              .where("name", "==", username);

            userBooks.get().then(function (querySnapshot) {
              querySnapshot.forEach(function (doc) {
                //putting up list
                console.log(doc.id, " => ", doc.data());
                var userBookList = doc.data().books.reverse();
                userBookList.forEach((el) => {
                  console.log(el);
                  db.collection("books")
                    .doc(el)
                    .get()
                    .then(function (doc) {
                      count++;
                      logDiv.insertAdjacentHTML(
                        "beforeend",
                        `
                    <div class="logItem" style="margin-bottom: .25em">
                  <span class="lognum">${count}.</span>
                  <img src="${doc.data().imageUrl}">
                  <span class="title"><a href="${doc.data().webLink}">${
                          doc.data().title
                        }</a></br><span class="authorlist">${
                          doc.data().author
                        }</span>
                </div>
                    `
                      );
                    });
                });
              });
            });
            usersDiv.style.display = "none";
            logDiv.style.display = "block";
          });
        });
      });
  }
}

usersMenu.addEventListener("click", usersMenuUp);

var bookTitle,
  bookAuthor,
  bookPages,
  dueDate,
  bookDocId,
  pagesAve,
  id,
  imageUrl,
  webLink;

//Grab the form info on Enter

//form buckets

var enteredTitle, enteredAuth, diff, volume;
var topThree = [];

var authClass = document.getElementById("authorChoice").classList;

//manual entry function
function manual() {
  document.getElementById("enterButton").style.display = "none";
  authClass.remove("0");
  authClass.remove("1");
  authClass.remove("2");
  authClass.add("unknown");
  document.getElementById("question").style.display = "none";
  document.getElementById("pages").style.display = "block";
  document.getElementById("confirm").style.display = "block";
  document.getElementById("pageNum").style.display = "none";
  document.getElementById("pagesDiv").style.display = "block";
  document.getElementById("pages").style.display = "block";
}

//add book to books function
function bookToBooks() {
  db.collection("books").doc(bookDocId).set({
    title: bookTitle,
    author: bookAuthor,
    pages: bookPages,
    due: dueDate,
    id: id,
    imageUrl: imageUrl,
    webLink: webLink,
    finished: 0,
  });
}
// put up logged function
function loggedUp() {
  document.getElementById("confirm").style.display = "none";
  document.getElementById("dueDate").innerText = `${dueDate}`;
  document.getElementById("logged").style.display = "block";
}
//add book to user function
function bookToUser() {
  userDoc.update({
    books: firebase.firestore.FieldValue.arrayUnion(bookDocId),
    unfinished: firebase.firestore.FieldValue.increment(1),
  });
}
//calculate due date function

function calcDue() {
  const today = new Date();
  const finalDate = new Date(today);
  if (bookPages >= 400) {
    finalDate.setDate(today.getDate() + 21);
  } else if (bookPages >= 600) {
    finalDate.setDate(today.getDate() + 28);
  } else {
    finalDate.setDate(today.getDate() + 14);
  }
  if (diff == "Tricky") {
    finalDate.setDate(finalDate.getDate() + 7);
  }

  if (unfinished >= 1) {
    finalDate.setDate(finalDate.getDate() + 7);
  }

  dueDate = finalDate.toLocaleDateString();
}

//
function onEnterClick() {
  enteredTitle = document.getElementById("booktitle").value;
  diff = document.getElementById("diff").value;
  enteredAuth = document.getElementById("authorname").value;
  document.getElementById("error").style.display = "none";
  document.getElementById("needTitle").style.display = "none";
  if (
    enteredTitle.length >= 1 &&
    enteredAuth.length >= 1 &&
    diff !== "Select"
  ) {
    document.getElementById("error").style.display = "none";
    document.getElementById("needTitle").style.display = "none";
    console.log(`Entered title: ${enteredTitle}`);
    console.log(`Difficulty: ${diff}`);
    //look up title
    const fetchPromise = fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${enteredTitle}${enteredAuth}&maxResults=5&key=AIzaSyDz7RLi3HFqoAlJVKOOK6e3kIOMdGTR8Gg`
    );
    fetchPromise
      .then((response) => {
        return response.json();
      })
      .then((x) => {
        if (x.totalItems !== 0) {
          for (let i = 0; i < 5; i++) {
            if (x.items[i].volumeInfo.pageCount >= 1) {
              topThree.push(x.items[i]);
            }
          }
        }
        console.log(topThree);
      })
      .then(() => {
        if (
          typeof topThree[0] !== "undefined" &&
          typeof topThree[0].volumeInfo.authors !== "undefined"
        ) {
          document.getElementById("enterButton").style.display = "none";
          document.getElementById(
            "authorChoice"
          ).innerText = `${topThree[0].volumeInfo.authors[0]}`;
          authClass.add("0");
          document.getElementById("question").style.display = "block";
          //
          function onYesClick() {
            var vol = document.getElementById("authorChoice").classList[0];
            volume = topThree[vol];
            console.log(volume);
            //Fill in the info in the form,
            //title, authorname, pages
            //prompt if correct
            document.getElementById("booktitle").style.display = "none";
            document.getElementById(
              "replacedTitle"
            ).innerText = `${volume.volumeInfo.title}`;
            document.getElementById("replacedTitle").style.display = "block";
            document.getElementById("authorname").style.display = "none";
            document.getElementById(
              "replacedAuth"
            ).innerText = `${volume.volumeInfo.authors[0]}`;
            //
            const pagesList = [];
            topThree.forEach((i) => {
              if (i.volumeInfo.authors[0] == volume.volumeInfo.authors[0]) {
                pagesList.push(i.volumeInfo.pageCount);
              }
            });
            console.log(pagesList);
            pagesAve = Math.round(
              pagesList.reduce((acc, next) => acc + next) / pagesList.length
            );
            console.log(pagesAve);
            //
            document.getElementById("pagesNo").innerText = `${pagesAve}`;
            document.getElementById("pages").style.display = "block";
            document.getElementById("replacedAuth").style.display = "block";
            document.getElementById("enterButton").style.display = "none";
            document.getElementById("confirm").style.display = "block";
            document.getElementById("question").style.display = "none";
            //add function for confirm, setting all the vars and then calling the functions
            function foundConfirm() {
              //   var bookTitle, bookAuthor, bookPages, dueDate,  bookDocId;

              bookTitle = volume.volumeInfo.title;
              bookAuthor = volume.volumeInfo.authors[0];
              var x = Math.random();
              bookDocId = x.toString();
              bookPages = pagesAve;
              id = volume.id;
              webLink = volume.volumeInfo.canonicalVolumeLink;
              imageUrl = volume.volumeInfo.imageLinks.smallThumbnail;
              calcDue();
              bookToBooks();
              bookToUser();
              loggedUp();
              history.pushState(null, null, null);
              pageState = 1;
            }
            //
            // add the event listeners for confirm and cancel
            document
              .getElementById("confirmButton")
              .addEventListener("click", () => {
                foundConfirm();
              });
            document
              .getElementById("confirmButton")
              .addEventListener("keydown", () => {
                if (event.keyCode === 13) {
                  foundConfirm();
                }
              });

            document
              .getElementById("cancelButton")
              .addEventListener("click", () => {
                location.reload();
              });
            document
              .getElementById("cancelButton")
              .addEventListener("keydown", () => {
                location.reload();
              });
            //
          }
          //
          document.getElementById("yes").addEventListener("click", onYesClick);
          document.getElementById("yes").addEventListener("keydown", () => {
            if (event.keyCode === 13) {
              onYesClick();
            }
          });

          function onNoClick() {
            if (
              authClass.contains("0") == true &&
              typeof topThree[1] !== "undefined"
            ) {
              authClass.remove("0");
              authClass.add("1");
              volume = topThree[1];
              console.log(volume);
              document.getElementById(
                "authorChoice"
              ).innerText = `${volume.volumeInfo.authors[0]}`;
            } else {
              if (
                authClass.contains("1") == true &&
                typeof topThree[2] !== "undefined"
              ) {
                authClass.remove("1");
                authClass.add("2");
                volume = topThree[2];
                document.getElementById(
                  "authorChoice"
                ).innerText = `${volume.volumeInfo.authors[0]}`;
              } else {
                manual();
                function manualConfirm() {
                  //   var bookTitle, bookAuthor, bookPages, dueDate,  bookDocId;
                  enteredTitle = document.getElementById("booktitle").value;
                  diff = document.getElementById("diff").value;
                  enteredAuth = document.getElementById("authorname").value;
                  var enteredPages = document.getElementById("pageInput").value;
                  webLink = "javascript:void(0);";
                  imageUrl = "images/book.png";
                  id = 0;
                  if (
                    enteredTitle.length >= 1 &&
                    enteredAuth.length >= 1 &&
                    diff !== "Select" &&
                    enteredPages >= 1
                  ) {
                    console.log(enteredPages);
                    bookTitle = document.getElementById("booktitle").value;
                    console.log(bookTitle);
                    bookAuthor = document.getElementById("authorname").value;
                    bookPages = document.getElementById("pageInput").value;
                    var x = Math.random();
                    bookDocId = x.toString();
                    calcDue();
                    bookToBooks();
                    bookToUser();
                    loggedUp();
                    document.getElementById("error").style.display = "none";
                    history.pushState(null, null, null);
                    pageState = 1;
                  } else {
                    document.getElementById("error").style.display = "block";
                    document.getElementById("needTitle").style.display =
                      "block";
                  }
                }
                //event listeners
                document
                  .getElementById("confirmButton")
                  .addEventListener("click", () => {
                    manualConfirm();
                  });
                document
                  .getElementById("confirmButton")
                  .addEventListener("keydown", () => {
                    if (event.keyCode === 13) {
                      manualConfirm();
                    }
                  });

                document
                  .getElementById("cancelButton")
                  .addEventListener("click", () => {
                    location.reload();
                  });
                document
                  .getElementById("cancelButton")
                  .addEventListener("keydown", () => {
                    location.reload();
                  });
                //
              }
            }
          }

          document.getElementById("no").addEventListener("click", onNoClick);
          document.getElementById("no").addEventListener("keydown", () => {
            if (event.keyCode === 13) {
              onNoClick();
            }
          });
          //
        } else {
          manual();
          //add event listener for confirm  and cancel, setting all the vars and then calling the functions
          function manualConfirm() {
            //   var bookTitle, bookAuthor, bookPages, dueDate,  bookDocId;
            enteredTitle = document.getElementById("booktitle").value;
            diff = document.getElementById("diff").value;
            enteredAuth = document.getElementById("authorname").value;
            var enteredPages = document.getElementById("pageInput").value;
            if (
              enteredTitle.length >= 1 &&
              enteredAuth.length >= 1 &&
              diff !== "Select" &&
              enteredPages >= 1
            ) {
              console.log(enteredPages);
              bookTitle = document.getElementById("booktitle").value;
              console.log(bookTitle);
              bookAuthor = document.getElementById("authorname").value;
              bookPages = document.getElementById("pageInput").value;
              var x = Math.random();
              bookDocId = x.toString();
              webLink = "javascript:void(0);";
              imageUrl = "images/book.png";
              id = 0;
              calcDue();
              bookToBooks();
              bookToUser();
              loggedUp();
              document.getElementById("error").style.display = "none";
              history.pushState(null, null, null);
              pageState = 1;
            } else {
              document.getElementById("error").style.display = "block";
              document.getElementById("needTitle").style.display = "block";
            }
          }
          //event listeners
          document
            .getElementById("confirmButton")
            .addEventListener("click", () => {
              manualConfirm();
            });
          document
            .getElementById("confirmButton")
            .addEventListener("keydown", () => {
              if (event.keyCode === 13) {
                manualConfirm();
              }
            });

          document
            .getElementById("cancelButton")
            .addEventListener("click", () => {
              location.reload();
            });
          document
            .getElementById("cancelButton")
            .addEventListener("keydown", () => {
              location.reload();
            });
        }
      });
  } else {
    document.getElementById("error").style.display = "block";
    document.getElementById("needTitle").style.display = "block";
  }
}

document.getElementById("enterButton").addEventListener("click", onEnterClick);
document.getElementById("enterButton").addEventListener("keydown", () => {
  if (event.keyCode === 13) {
    onEnterClick();
  }
});
