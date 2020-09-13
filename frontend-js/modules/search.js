import axios from "axios";

import DOMPurify from "dompurify";

export default class Search {
  constructor() {
    this._csrf = document.querySelector('[name="_csrf"]').value;

    this.injectHTML();

    this.searchIcon = document.querySelector(".header-search-icon");
    this.overlay = document.querySelector(".search-overlay");
    this.closeIcon = document.querySelector(".close-live-search");
    this.inputField = document.querySelector("#live-search-field");
    this.searchResults = document.querySelector(".live-search-results");
    this.loaderIcon = document.querySelector(".circle-loader");
    this.typingWaitTimer;
    this.previousValue = "";
    this.events();
  }
  // events
  events() {
    this.inputField.addEventListener("keyup", () => {
      this.keypressHandler();
    });
    this.searchIcon.addEventListener("click", (e) => {
      e.preventDefault();
      this.openOverlay();
    });
    this.closeIcon.addEventListener("click", (e) => {
      this.closeOverlay();
    });
  }
  //* Methods
  keypressHandler() {
    let value = this.inputField.value;
    if (value == "") {
      clearTimeout(this.typingWaitTimer);
      this.hideLoaderIcon();
      this.hideSearchResults();
    }
    if (value != "" && value != this.previousValue) {
      // clearing out left and right key press issues
      clearTimeout(this.typingWaitTimer); // clear the timer so not to wait on each keypress
      this.showLoaderIcon();
      this.hideSearchResults();
      this.typingWaitTimer = setTimeout(() => this.sendRequest(), 3000);
    }
    this.previousValue = value;
  }

  sendRequest() {
    axios
      .post("/search", { _csrf: this._csrf, searchTerm: this.inputField.value })
      .then((response) => {
        if (response.data) {
          this.renderResultsHTML(response.data);
        } else {
          console.log("response not completed");
        }
      })
      .catch(() => {
        console.log("failed request");
      });
  }

  renderResultsHTML(posts) {
    console.log(posts);

    if (posts.length) {
      console.log(posts);
      this.searchResults.innerHTML = `<div class="list-group shadow-sm">
      <div class="list-group-item active"><strong>Search Results</strong>
      ${
        posts.length > 1 ? `${posts.length} items found` : `1 item found`
      } </div>
      ${posts
        .map((post) => {
          let postDate = new Date(post.createdDate);
          return `<a href="/post/${
            post._id
          }" class="list-group-item list-group-item-action">
          <img class="avatar-tiny" src="${post.author.avatar}"> <strong>${
            post.title
          }</strong>
          <span class="text-muted small">by ${
            post.author.username
          } on ${postDate.getMonth()}/${postDate.getDate()}/${postDate.getFullYear()}</span>
        </a>`;
        })
        .join("")}
    </div>`;
    } else {
      this.searchResults.innerHTML = `<p class="alert alert-danger text-center shadow-sm">Sorry, we could not find any results for that search.</p>`;
    }
    this.showSearchResults();
    this.hideLoaderIcon();
  }

  showLoaderIcon() {
    this.loaderIcon.classList.add("circle-loader--visible");
  }
  hideLoaderIcon() {
    this.loaderIcon.classList.remove("circle-loader--visible");
  }
  showSearchResults() {
    this.searchResults.classList.add("live-search-results--visible");
  }
  hideSearchResults() {
    this.searchResults.classList.remove("live-search-results--visible");
  }
  closeOverlay() {
    this.overlay.classList.remove("search-overlay--visible");
  }
  openOverlay() {
    this.overlay.classList.add("search-overlay--visible");
    setTimeout(() => this.inputField.focus(), 500);
  }
  injectHTML() {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div class="search-overlay">
      <div class="search-overlay-top shadow-sm">
        <div class="container container--narrow">
          <label for="live-search-field" class="search-overlay-icon"><i class="fas fa-search"></i></label>
          <input type="text" id="live-search-field" class="live-search-field" placeholder="What are you interested in?">
          <span class="close-live-search"><i class="fas fa-times-circle"></i></span>
        </div>
      </div>
  
      <div class="search-overlay-bottom">
        <div class="container container--narrow py-3">
          <div class="circle-loader"></div>
          <div class="live-search-results "> </div>
        </div>
      </div>
    </div>`
    );
  }
}
