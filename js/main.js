// REUSABLE FUNCTIONS
// - FUNCTION THAT ACTIVATES THE BANNER SLIDER & ITS BUTTONS
function activateSlider({
  sliderSelector,
  imagesSelector, // <-- IMAGES CONTAINER SELECTOR
  prevBtnSelector,
  nextBtnSelector,
  indicatorsSelector, // <-- INDICATORS CONTAINER SELECTOR
}) {
  const imagesContainer = document.querySelector(imagesSelector);
  const images = [...(imagesContainer?.children || [])];
  const lastImageIndex = images.length - 1;
  let indicators = undefined;
  let activeImageIndex = 0;
  let autoSlideInterval = undefined;
  let autoSlideTimeout = undefined;

  // ENSURE THE SLIDER ELEMENT EXISTS & CONTAINS AT LEAST ONE IMAGE
  if (!imagesContainer || images.length < 1) {
    console.error(
      "Slider initialization failed: Either the images container element was not found or no images were found inside it. Check your HTML structure."
    );
    return;
  }

  const updateActiveImageIndex = (direction = "next") => {
    switch (direction) {
      case "prev":
        // NAVIGATE TO THE PREVIOUS IMAGE IN THE SLIDER. LOOPS TO THE LAST IMAGE IF AT THE BEGINNING
        activeImageIndex =
          activeImageIndex <= 0 ? lastImageIndex : activeImageIndex - 1;
        break;
      case "next":
        // NAVIGATE TO THE NEXT IMAGE IN THE SLIDER. LOOPS TO THE FIRST IMAGE IF AT THE END
        activeImageIndex =
          activeImageIndex >= lastImageIndex ? 0 : activeImageIndex + 1;
        break;
      default:
        console.error(
          'The direction parameter must be either "prev" or "next".'
        );
    }
  };

  const updateImage = () => {
    // MOVE THE IMAGES CONTAINER TO DISPLAY THE CURRENTLY ACTIVE IMAGE BASED ON ITS OFFSET
    imagesContainer.style.transform = `translateX(${-images[activeImageIndex]
      .offsetLeft}px)`;

    // HIGHLIGHT THE ACTIVE IMAGE INDICATOR
    indicators?.querySelector("button.active")?.classList.remove("active");
    indicators?.children[activeImageIndex]
      ?.querySelector("button")
      .classList.add("active");
  };

  const manageAutoSliding = (state = "on", interval = 3000, timeout = 6000) => {
    clearInterval(autoSlideInterval);
    clearTimeout(autoSlideTimeout);

    const intervalHandling = () => {
      autoSlideInterval = setInterval(() => {
        updateActiveImageIndex();
        updateImage();
      }, interval);
    };

    switch (state) {
      case "on":
        intervalHandling();
        break;
      case "pause":
        autoSlideTimeout = setTimeout(() => {
          intervalHandling();
        }, timeout);
        break;
      default:
        console.error('The state parameter must be either "on" or "pause".');
    }
  };

  const renderIndicators = () => {
    if (images.length < 2) return;

    indicators = document.querySelector(indicatorsSelector);
    if (!indicators) {
      console.error("Indicators container not found.");
      return;
    }

    // CREATE INDICATORS DYNAMICALLY FOR EACH SLIDER IMAGE
    indicators.innerHTML = images
      .map((_, i) => {
        return `
          <li>
            <button ${i === 0 ? "class='active'" : ""}
                aria-label="Go to image ${i + 1}">
            </button>
          </li>
        `;
      })
      .join("");

    // ADD CLICK EVENTS TO INDICATORS TO NAVIGATE TO THE CORRESPONDING IMAGES
    [...indicators.children].forEach((li, index) => {
      li.onclick = () => {
        activeImageIndex = index;
        updateImage();
        manageAutoSliding("pause");
      };
    });
  };

  const activateNavBtns = () => {
    if (!indicators) return;

    const prevBtn = document.querySelector(prevBtnSelector);
    const nextBtn = document.querySelector(nextBtnSelector);

    if (!prevBtn || !nextBtn) {
      console.error("Navigation buttons are missing.");
      return;
    }

    // ACTIVATE BUTTONS DISPLAY
    prevBtn.classList.add("active");
    nextBtn.classList.add("active");

    // ACTIVATE BUTTONS CLICKING
    prevBtn.onclick = () => {
      updateActiveImageIndex("prev");
      updateImage();
      manageAutoSliding("pause");
    };

    nextBtn.onclick = () => {
      updateActiveImageIndex("next");
      updateImage();
      manageAutoSliding("pause");
    };
  };

  // FUNCTION THAT ENABLES MOVING THE IMAGES BY SWIPING RIGHT OR LEFT
  const enableGestures = () => {
    const slider = document.querySelector(sliderSelector);

    if (!slider) {
      console.error("Slider element not found!");
      return;
    }

    const isLtr = document.dir === "ltr";
    let startX = 0;
    let endX = 0;

    const goToTheImage = (direction = "next") => {
      updateActiveImageIndex(direction);
      updateImage();
      manageAutoSliding("pause");
    };

    // ADD TOUCH EVENT LISTENERS TO HANDLE SWIPE GESTURES
    slider.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX; // <-- RECORD THE INITIAL TOUCH POSITION (X-COORDINATE)
    });

    slider.addEventListener("touchmove", (e) => {
      endX = e.touches[0].clientX; // <-- CONTINUOUSLY RECORD THE CURRENT TOUCH POSITION DURING SWIPE
    });

    slider.addEventListener("touchend", () => {
      const deltaX = endX - startX;

      // MINIMUM SWIPE DISTANCE REQUIRED TO TRIGGER A SLIDE (50PX, CHOSEN AS A REASONABLE THRESHOLD FOR USER SWIPE)
      if (Math.abs(deltaX) > 50) {
        // IN LTR: SWIPE LEFT MOVES TO NEXT, SWIPE RIGHT MOVES TO PREVIOUS (REVERSED FOR RTL)
        if (deltaX < 0) {
          isLtr ? goToTheImage("next") : goToTheImage("prev");
        } else {
          isLtr ? goToTheImage("prev") : goToTheImage("next");
        }
      }
    });
  };

  // INITIALIZE SLIDER
  renderIndicators();
  activateNavBtns();
  manageAutoSliding();
  enableGestures();

  // ADJUST THE POSITION OF THE ACTIVE IMAGE WHEN THE WINDOW IS RESIZED TO MAINTAIN ITS CORRECT WIDTH
  window.addEventListener("resize", updateImage);
}

// - POPUP
function popup({
  containerClass,
  arrOfContainerContent,
  scrollElement = undefined,
}) {
  const popup = document.getElementById("popup");
  const contentContainer = popup?.querySelector(".popup-content-container");
  const closeBtn = document.getElementById("close-btn");

  if (!popup || !contentContainer || !closeBtn) {
    throw new Error(
      "One or more required elements are missing: 'popup', 'popup-content-container', or 'close-btn'."
    );
  }

  const state = {
    isClosing: false,
    isDragging: false,
    startY: 0,
  };

  const handlers = {
    clickOnPopup: (e) => {
      // CLOSE THE POPUP IF CLICKING ON THE BACKGROUND OR THE CLOSE BUTTON
      if (e.target === popup || e.target === closeBtn) {
        handlers.closePopup();
      }
    },

    closePopup: () => {
      if (state.isClosing) return; // <-- PREVENT MULTIPLE CALLS IF ALREADY CLOSING

      state.isClosing = true;

      // MOVE THE "contentContainer" OFFSCREEN (DOWNWARD) TO HIDE IT
      contentContainer.style.transform = `translateY(${window.innerHeight}px)`;

      // REMOVE THE "active" CLASS FROM THE POPUP TO CLOSE IT
      popup.classList.remove("active");

      // ENABLE PAGE SCROLLING AGAIN
      document.body.style.overflow = "";

      // CLEAN UP THE CONTENT INSIDE "contentContainer"
      const handleTransitionEnd = () => {
        contentContainer.classList.remove(containerClass);
        contentContainer.innerHTML = ""; // <-- CLEAR ALL CONTENT INSIDE THE CONTAINER
        contentContainer.appendChild(closeBtn); // <-- RE-ADD THE CLOSE BUTTON
        contentContainer.style.transform = ""; // <-- RESET TRANSFORM STYLES

        // RESET CLOSING & DRAGGING STATE
        state.isClosing = false;
        state.isDragging = false;

        // REMOVE EVENT LISTENER TO AVOID MEMORY LEAKS
        contentContainer.removeEventListener(
          "transitionend",
          handleTransitionEnd
        );
      };

      // LISTEN FOR THE TRANSITION END EVENT BEFORE CLEAN UP THE CONTENT
      contentContainer.addEventListener("transitionend", handleTransitionEnd, {
        once: true, // <-- ENSURE LISTENER RUNS ONLY ONCE
      });
    },

    touchStart: (e) => {
      if (state.isClosing) return; // <-- PREVENT MULTIPLE CALLS IF ALREADY CLOSING

      // UPDATE DRAGGING & START-Y STATE
      state.isDragging = true;
      state.startY = e.touches[0]?.clientY; // <-- STORE THE INITIAL VERTICAL POSITION OF THE TOUCH EVENT FOR DRAG CALCULATION

      // DISABLE TRANSITION EFFECT DURING DRAG TO AVOID UNWANTED ANIMATIONS
      contentContainer.style.transition = "none";
    },

    touchMove: (e) => {
      if (state.isClosing || !state.isDragging) return; // <-- PREVENT MULTIPLE CALLS IF ALREADY CLOSING OR IF NOT DRAGGING

      e.preventDefault(); // <-- PREVENT DEFAULT SCROLL BEHAVIOR TO AVOID PAGE SCROLLING DURING TOUCH MOVEMENT

      const currentY = e.touches[0]?.clientY;
      const deltaY = currentY - state.startY;

      // APPLY TRANSFORM ONLY IF MOVEMENT IS DOWNWARD (POSITIVE deltaY)
      if (deltaY > 0) {
        contentContainer.style.transform = `translateY(${deltaY}px)`; // <-- MOVE THE "contentContainer" VERTICALLY TO A NEW POSITION BASED ON THE DOWNWARD DRAG DISTANCE (deltaY)
      }
    },

    touchEnd: (e) => {
      if (state.isClosing || !state.isDragging) return; // <-- PREVENT MULTIPLE CALLS IF ALREADY CLOSING OR IF NOT DRAGGING

      const endY = e.changedTouches[0]?.clientY;
      const deltaY = endY - state.startY;

      // RESET THE TRANSITION STYLE TO ENABLE SMOOTH TRANSITIONS AFTER THE DRAG ENDS
      contentContainer.style.transition = "";

      // RESET DRAGGING STATE
      state.isDragging = false;

      // IF DRAG DISTANCE IS LARGE ENOUGH
      if (deltaY > 100 || (deltaY > 0 && Math.abs(deltaY) / 100 > 0.3)) {
        handlers.closePopup(); // <-- CLOSE THE POPUP
      } else {
        contentContainer.style.transform = ""; // <-- RESET THE CONTAINER POSITION IF THE DRAG DISTANCE IS INSUFFICIENT TO CLOSE THE POPUP
      }
    },

    touchOnScrollElement: (e) => {
      e.stopPropagation(); // <-- DISABLE DRAG GESTURE FROM "scrollElement"
    },
  };

  const events = {
    // ADD ALL EVENTS RELATED TO THE POPUP
    add: () => {
      try {
        popup.addEventListener("click", handlers.clickOnPopup);

        scrollElement?.addEventListener(
          "touchstart",
          handlers.touchOnScrollElement
        );

        // SETUP EVENT LISTENERS FOR GESTURE HANDLING
        contentContainer.addEventListener("touchstart", handlers.touchStart, {
          passive: true, // <-- "touchstart" IS PASSIVE BECAUSE WE DON'T NEED TO PREVENT DEFAULT SCROLLING BEHAVIOR DURING THE TOUCH START
        });
        contentContainer.addEventListener("touchmove", handlers.touchMove, {
          passive: false, // <-- "touchmove" IS NON-PASSIVE TO ALLOW PREVENTING DEFAULT SCROLLING BEHAVIOR WHILE DRAGGING
        });
        contentContainer.addEventListener("touchend", handlers.touchEnd, {
          passive: true, // <-- "touchend" IS PASSIVE AS WE DON'T NEED TO PREVENT DEFAULT BEHAVIOR AFTER TOUCH ENDS
        });
      } catch (error) {
        console.error("Error adding popup events:", error);
      }
    },

    // REMOVE ALL EVENTS RELATED TO THE POPUP
    remove: () => {
      try {
        popup.removeEventListener("click", handlers.clickOnPopup);

        scrollElement?.removeEventListener(
          "touchstart",
          handlers.touchOnScrollElement
        );

        contentContainer.removeEventListener("touchstart", handlers.touchStart);
        contentContainer.removeEventListener("touchmove", handlers.touchMove);
        contentContainer.removeEventListener("touchend", handlers.touchEnd);
      } catch (error) {
        console.error("Error removing popup events:", error);
      }
    },
  };

  // RETURNS THE API TO CONTROL OPENING & CLOSING THE POPUP
  return {
    open: () => {
      state.isClosing = false;
      state.isDragging = false;
      contentContainer.style.transform = "";
      document.body.style.overflow =
        "hidden"; /* <-- PREVENTS SCROLLING IN THE PAGE*/
      popup.classList.add("active");
      contentContainer.classList.add(containerClass);
      contentContainer.append(...arrOfContainerContent);
      events.add();
    },
    close: () => {
      handlers.closePopup();
      events.remove();
    },
  };
}

// MAIN HEADER
function mainHeader() {
  // FUNCTION THAT ACTIVATES THE LANGUAGE BUTTON
  const activateLanguageBtn = () => {
    const langsElement = document.getElementById("languages");
    const languageBtn = document.getElementById("lang-btn");

    // FUNCTION THAT TOGGLES THE ACTIVATION OF THE LANGUAGES ELEMENT TO OPEN & CLOSE THE LANGUAGES MENU
    const toggleLangsElement = (e) => {
      e.stopPropagation(); // <-- PREVENT EVENT FROM BUBBLING UP THE DOM TREE
      langsElement.classList.toggle("active"); // <-- TOGGLE ACTIVATION

      // IF THE LANGUAGES ELEMENT IS ACTIVE, LISTEN FOR OUTSIDE CLICKS TO CLOSE IT
      if (langsElement.classList.contains("active")) {
        document.addEventListener(
          "click",
          () => {
            // REMOVE THE active CLASS FROM LANGUAGES ELEMENT TO HIDE THE LANGUAGES MENU
            langsElement.classList.remove("active");
          },
          { once: true } // <-- ENSURE THIS LISTENER RUNS ONLY ONCE
        );
      }
    };

    // ADD CLICK EVENT TO THE LANGUAGE BUTTON TO TOGGLE THE MENU
    languageBtn.addEventListener("click", toggleLangsElement);
  };

  activateLanguageBtn();
}

// BANNER SECTION
function bannerSection() {
  const bannerSelectors = {
    sliderSelector: "#banner-section .slider",
    imagesSelector: "#banner-section .slider .images",
    prevBtnSelector: "#banner-section .slider .nav-buttons #prev",
    nextBtnSelector: "#banner-section .slider .nav-buttons #next",
    indicatorsSelector: "#banner-section .slider .indicators",
  };

  activateSlider(bannerSelectors);
}

// CATEGORIES SECTION
function categoriesSection() {
  const foodSections = document.querySelectorAll("#food-sections > section"); // <-- WE NEED TO USE THIS SECTION TO ACTIVATE LINKS & POPULATE POPUP CONTENT DYNAMICALLY

  // FUNCTION THAT ACTIVATES CATEGORY LINKS DURING SCROLLING
  const activateCategoryLinks = () => {
    const categoryLinks = document.querySelectorAll(
      "#categories-section nav > a"
    );

    // ---------------------------------------------------------------------------------------------------
    let isScreenZoomed = false;
    const checkZoomLevel = () => {
      const scale = window.visualViewport?.scale || 1; // GET ZOOM LEVEL
      isScreenZoomed = scale > 1; // IF THE ZOOM LEVEL IS GREATER THAN 1, CONSIDER THE SCREEN TO BE ZOOMED
    };

    // - MONITOR ZOOM CHANGES
    window.visualViewport?.addEventListener("resize", checkZoomLevel);
    window.visualViewport?.addEventListener("scroll", checkZoomLevel);
    // ---------------------------------------------------------------------------------------------------
    /* 
      THE ENCLOSED CODE ABOVE I WROTE BECAUSE IN THE CURRENT PAGE DESIGN, WE NEED TO KNOW WHETHER THE USER DID PINCH-ZOOM OR NOT,
      BECAUSE IF HE DID, THE CODE RESPONSIBLE FOR THE AUTO SCROLL TO ACTIVE BUTTON MUST BE DISABLED SO THAT THERE IS NO HANG ON THE SCREEN.
      YOU WILL FIND THE USE OF THE VARIABLE --> isScreenZoomed <-- BELOW WHEN UPDATING THE ACTIVE LINK.
    */

    // ACTIVATE LINKS USING DEBOUNCE TECHNIQUE TO IMPROVE PERFORMANCE
    let scrollTimeout;
    window.addEventListener("scroll", () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        // HERE THE ACTIVATION OF LINKS BEGINS
        let currentSection = "";

        if (window.scrollY < foodSections[0].offsetTop) {
          currentSection = foodSections[0].getAttribute("id");
        } else {
          // DETERMINE THE ACTIVE SECTION BASED ON THE SCROLL POSITION
          foodSections.forEach((section) => {
            const sectionTop = section.offsetTop - 250; // ADJUST TOP DISTANCE
            const sectionHeight = section.offsetHeight;

            if (
              window.scrollY >= sectionTop &&
              window.scrollY < sectionTop + sectionHeight
            ) {
              currentSection = section.getAttribute("id");
            }
          });
        }

        // UPDATE ACTIVE LINK
        categoryLinks.forEach((link) => {
          link.classList.remove("active");

          if (link.getAttribute("href") === `#${currentSection}`) {
            link.classList.add("active");

            // IF THERE IS NO ZOOM ON THE SCREEN
            if (!isScreenZoomed) {
              // AUTO SCROLL TO ACTIVE BUTTON
              link.scrollIntoView({
                behavior: "smooth",
                inline: "start",
                block: "nearest",
              });
            }
          }
        });
      }, 30);
    });
  };

  // FUNCTION THAT ACTIVATES THE CATEGORY SEARCH BUTTON
  const activateCategorySearchBtn = () => {
    const searchBtn = document.getElementById("search-btn");

    if (!searchBtn) {
      console.error("Search button not found!");
      return;
    }

    // FUNCTION THAT CREATES THE CONTENT OF THE CATEGORIES SEARCH POPUP (IT'S RUN DIRECTLY TO RETURN & STORE THE RESULT)
    const popupContent = (() => {
      // GET STATIC ELEMENTS
      const staticElements = document.getElementById(
        "static-search-popup-elements"
      );
      const popupTitle = staticElements.querySelector(".popup-title");
      const searchContainer = staticElements.querySelector(".search-container");
      const searchBox = searchContainer.querySelector(".search-box");
      const clearSearchBtn = searchContainer.querySelector(".clear-btn");
      const noResultsMessage = staticElements.querySelector(".no-results-msg");

      if (
        !staticElements ||
        !popupTitle ||
        !searchContainer ||
        !searchBox ||
        !clearSearchBtn ||
        !noResultsMessage
      ) {
        throw new Error("One of the search popup static elements is missing.");
      }

      // CREATE DYNAMIC ELEMENTS
      // - CREATE NAVIGATION LINKS CONTAINER
      const navLinks = document.createElement("nav");
      navLinks.className = "hide-scrollbar";

      // - CREATE MENU LINKS WITH SECTION INFO (NAME & ITEM COUNT)
      const linksFragment = document.createDocumentFragment(); // <-- IMPROVE PERFORMANCE BY USING "DocumentFragment"
      const cleanText = (text) =>
        text.replace(/[^\p{L}\p{N}]+/gu, "").toLowerCase(); // <-- FUNCTION THAT CLEANS TEXT FROM SPACES & SYMBOLS IN ORDER TO IMPROVE SEARCH ACCURACY

      foodSections.forEach((section) => {
        const secId = section.id;
        const secName = section.querySelector("h1").textContent;
        const itemCount = section.querySelectorAll("figure").length;

        const link = document.createElement("a");
        const nameSpan = document.createElement("span");
        const countSpan = document.createElement("span");

        link.href = `#${secId}`;
        link.ariaLabel = secName;
        link.dataset.cleanText = cleanText(secName);
        nameSpan.textContent = secName;
        countSpan.textContent = `${itemCount} ${
          document.dir === "ltr"
            ? `item${itemCount > 1 ? "s" : ""}`
            : ":العناصر"
        }`;

        link.append(nameSpan, countSpan);
        linksFragment.appendChild(link);
      });

      navLinks.append(noResultsMessage, linksFragment); // <-- APPEND "NO RESULTS" MESSAGE & LINKS TO NAVIGATION

      // ENABLE SEARCH WITH DEBOUNCE
      const links = Array.from(navLinks.children).filter(
        (child) => child.tagName === "A"
      );

      let debounceTimer;
      function processingSearchInputs(inputs = "") {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const query = cleanText(inputs);
          let hasResults = false;

          links.forEach((link) => {
            const match = link.dataset.cleanText.includes(query);
            link.classList.toggle("hidden", !match);
            if (match) hasResults = true;
          });

          clearSearchBtn.classList.toggle("show", inputs.length > 0);
          noResultsMessage.classList.toggle("show", !hasResults);
        }, 200); // <-- DELAY FOR DEBOUNCE
      }

      searchBox.oninput = function () {
        processingSearchInputs(this.value);
      };

      clearSearchBtn.onclick = () => {
        processingSearchInputs();
        searchBox.value = "";
        searchBox.focus();
      };

      // RETURN THE CONFIGURED CONTENT & ELEMENTS FOR THE POPUP
      return {
        containerClass: "categories-search",
        arrOfContainerContent: [popupTitle, searchContainer, navLinks],
        scrollElement: navLinks,
      };
    })();

    // CREATE A POPUP INSTANCE FOR THE CATEGORIES SEARCH POPUP
    const categoriesSearchPopup = popup(popupContent);

    // ADD LISTENERS
    // - OPEN THE CATEGORIES SEARCH POPUP WHEN CLICKING ON SEARCH BUTTON
    searchBtn.onclick = categoriesSearchPopup.open;

    // - CLOSE THE CATEGORIES SEARCH POPUP WHEN CLICKING ON ANY NAVIGATION LINK INSIDE IT
    popupContent.scrollElement.onclick = (e) => {
      if (e.target.closest("a")) categoriesSearchPopup.close();
    };
  };

  activateCategoryLinks();
  activateCategorySearchBtn();
}

// FOOD SECTION
function foodSection() {
  const activateClickingOnDishCard = () => {
    const dishCards = [...document.getElementsByClassName("dish-card")];

    // CREATE AN ARRAY OF OBJECTS CONTAINING DATA FROM EACH DISH CARD
    const cardsData = dishCards.map((card) => ({
      image: card.querySelector("img[alt='Dish Image']")?.src,
      title: card.querySelector(".dish-title")?.textContent,
      description: card.querySelector(".dish-description")?.textContent,
      price: card.querySelector(".dish-price")?.textContent,
    }));

    // FUNCTION THAT CREATES DISH DETAILS CONTENT FOR THE POPUP USING CARD DATA
    const popupContent = ({ image, title, description, price }) => {
      // CREATE DISH IMAGE
      const imgContainer = document.createElement("div");
      const img = document.createElement("img");
      imgContainer.classList.add("img-container");
      img.alt = "Dish Image";
      img.src = image;
      imgContainer.appendChild(img);

      // CREATE DISH DETAILS ELEMENTS
      const detailsContainer = document.createElement("div");
      const titleElement = document.createElement("h2");
      const descriptionElement = document.createElement("p");
      const priceElement = document.createElement("p");

      detailsContainer.classList.add("details-container");
      titleElement.id = "dish-title";
      descriptionElement.id = "dish-description";
      priceElement.id = "dish-price";

      titleElement.textContent = title;
      descriptionElement.textContent = description;
      priceElement.textContent = price;

      detailsContainer.append(titleElement, descriptionElement, priceElement);

      return {
        containerClass: "dish-details",
        arrOfContainerContent: [imgContainer, detailsContainer],
        scrollElement: descriptionElement,
      };
    };

    // CREATE A POPUP INSTANCE FOR EACH DISH'S DETAILS & ADD A CLICK LISTENER TO OPEN THE POPUP
    dishCards.forEach((card, i) => {
      // CREATE A POPUP INSTANCE
      const dishDetails = popup(popupContent(cardsData[i]));

      // ADD CLICK LISTENER
      card.addEventListener("click", dishDetails.open);
    });
  };

  activateClickingOnDishCard();
}

// THE APP STARTS FROM HERE
mainHeader();
bannerSection();
categoriesSection();
foodSection();
