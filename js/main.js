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

  // FUNCTION THAT ENABLES MOVING THE IMAGES BY SWIPING RIGHT OR LEFT USING THE HAMMER.JS LIBRARY
  const enableGestures = () => {
    const slider = document.querySelector(sliderSelector);

    if (!slider) {
      console.error("Slider element not found!");
      return;
    }

    const hammer = new Hammer(slider);
    const isLtr = document.dir === "ltr";

    const goToTheImage = (direction = "next") => {
      updateActiveImageIndex(direction);
      updateImage();
      manageAutoSliding("pause");
    };

    // ADD LISTENERS
    if (isLtr) {
      hammer.on("swipeleft", () => goToTheImage("next"));
      hammer.on("swiperight", () => goToTheImage("prev"));
    } else {
      hammer.on("swipeleft", () => goToTheImage("prev"));
      hammer.on("swiperight", () => goToTheImage("next"));
    }
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
  const contentContainer = popup.querySelector(".popup-content-container");
  const closeBtn = document.getElementById("close-btn");

  // GET THE POPUP'S TRANSITION DURATION FROM ITS CSS VARIABLE
  const transitionDuration = parseFloat(
    getComputedStyle(popup).getPropertyValue("--transition-duration")
  );

  if (!popup || !contentContainer) {
    console.error("Popup or content container not found!");
    return;
  }

  const popupCloseEvent = (event) => {
    if (
      event.target === event.currentTarget ||
      closeBtn.contains(event.target)
    ) {
      openPopup(false);
    }
  };

  const openPopup = (open = true) => {
    contentContainer.style.transform = ""; // <-- RESET "contentContainer" POSITION
    document.body.classList.toggle("no-scroll", open);
    popup.classList.toggle("active", open);

    if (open) {
      // ADD CONTENT INSIDE "contentContainer" & THE CLOSE POPUP EVENT
      contentContainer.classList.add(containerClass);
      contentContainer.append(...arrOfContainerContent);
      popup.addEventListener("click", popupCloseEvent);
    } else {
      // REMOVE THE CONTENT INSIDE "contentContainer" WITHOUT REMOVING THE STATIC CONTENT, AFTER THE POPUP TRANSITION DURATION
      setTimeout(() => {
        contentContainer.classList.remove(containerClass);

        while (
          contentContainer.lastChild &&
          contentContainer.lastChild !== closeBtn
        ) {
          contentContainer.removeChild(contentContainer.lastChild);
        }
      }, transitionDuration);

      // REMOVE THE CLOSE POPUP EVENT
      popup.removeEventListener("click", popupCloseEvent);
    }
  };

  // FUNCTION THAT ENABLES CLOSING THE POPUP BY DRAGGING IT DOWN USING THE HAMMER.JS LIBRARY
  const enableGestures = () => {
    const hammer = new Hammer(contentContainer);
    hammer.get("pan").set({ direction: Hammer.DIRECTION_VERTICAL });

    let startY = 0; // <-- VARIABLE TO STORE THE STARTING POSITION OF THE DRAG
    let animationFrameId = null; // <-- VARIABLE TO TRACK THE ANIMATION FRAME ID

    // LISTEN FOR THE START OF THE PAN
    hammer.on("panstart", () => {
      contentContainer.style.transition = "none"; // <-- DISABLE TRANSITIONS FOR SMOOTH DRAGGING
      startY = contentContainer.offsetTop; // <-- STORE THE INITIAL POSITION OF THE "contentContainer"
    });

    // LISTEN FOR MOVEMENT DURING THE PAN
    hammer.on("panmove", (event) => {
      if (animationFrameId) return;

      const newY = startY + event.deltaY;
      const isAtTop = scrollElement?.scrollTop === 0;

      // ALLOW MOVEMENT ONLY IF THE DRAG IS DOWNWARDS & CONDITIONS ARE MET
      if (newY > 0 && (isAtTop || !scrollElement?.contains(event.target))) {
        // USE REQUESTANIMATIONFRAME FOR BETTER PERFORMANCE
        animationFrameId = requestAnimationFrame(() => {
          contentContainer.style.transform = `translateY(${newY}px)`; // <-- APPLY THE NEW POSITION TO THE "contentContainer"
          animationFrameId = null; // <-- RESET THE ANIMATION FRAME ID
        });
      }
    });

    // LISTEN FOR THE END OF THE PAN
    hammer.on("panend", (event) => {
      contentContainer.style.transition = ""; // <-- RE-ENABLE TRANSITIONS
      contentContainer.style.transform = ""; // <-- RESET "contentContainer" POSITION

      // IF DRAG IS SUFFICIENT ENOUGH
      if (event.deltaY > 100 || event.velocityY > 0.3) {
        openPopup(false); // <-- CLOSE THE POPUP
      }
    });
  };

  enableGestures();

  // RETURN AN INTERFACE FOR MANUAL CONTROL OF OPENING & CLOSING THE POPUP
  return {
    open: () => openPopup(true),
    close: () => openPopup(false),
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
      }, 35);
    });
  };

  // FUNCTION THAT ACTIVATES THE CATEGORY MENU BUTTON
  const activateCategoryMenuBtn = () => {
    const menuBtn = document.getElementById("menu-btn");
    const isLtr = document.dir === "ltr";

    if (!menuBtn) {
      console.error("Menu button not found!");
      return;
    }

    // FUNCTION THAT CREATES CATEGORY MENU CONTENT FOR THE POPUP (IT'S RUN DIRECTLY TO RETURN & STORE THE RESULT)
    const popupContent = (() => {
      // CREATE POPUP TITLE BASED ON LANGUAGE
      const popupTitle = document.createElement("h1");
      popupTitle.textContent = isLtr ? "Menu Categories" : "اصناف القائمة";

      // CREATE NAVIGATION LINKS CONTAINER
      const navLinks = document.createElement("nav");
      navLinks.className = "hide-scrollbar";

      // IMPROVE PERFORMANCE BY USING "DocumentFragment"
      const linksFragment = document.createDocumentFragment();

      // CREATE MENU LINKS WITH SECTION INFO (NAME & ITEM COUNT)
      foodSections.forEach((section) => {
        const secId = section.id;
        const secName = section.querySelector("h1").textContent;
        const itemCount = section.querySelectorAll("figure").length;

        const link = document.createElement("a");
        const nameSpan = document.createElement("span");
        const countSpan = document.createElement("span");

        link.href = `#${secId}`;
        link.title = secId
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        nameSpan.textContent = secName;
        countSpan.dir = "ltr";
        countSpan.textContent = `${itemCount} ${
          isLtr ? `item${itemCount > 1 ? "s" : ""}` : ":العناصر"
        }`;

        link.append(nameSpan, countSpan);
        linksFragment.appendChild(link);
      });

      navLinks.appendChild(linksFragment); // <-- APPEND LINKS TO NAVIGATION

      return {
        containerClass: "category-menu",
        arrOfContainerContent: [popupTitle, navLinks],
        scrollElement: navLinks,
      };
    })();

    // CREATE A POPUP INSTANCE FOR THE CATEGORY LINKS MENU
    const categoryLinksMenu = popup(popupContent);

    // ADD LISTENERS
    // - OPEN THE CATEGORY MENU POPUP WHEN CLICKING ON CATEGORY MENU BUTTON
    menuBtn.onclick = categoryLinksMenu.open;

    // - CLOSE THE CATEGORY MENU POPUP WHEN CLICKING ON ANY NAVIGATION LINK INSIDE IT
    popupContent.scrollElement.onclick = (e) => {
      if (e.target.closest("a")) categoryLinksMenu.close();
    };
  };

  activateCategoryLinks();
  activateCategoryMenuBtn();
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
