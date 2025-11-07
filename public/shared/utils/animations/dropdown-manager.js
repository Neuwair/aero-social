export function initDropdownMenu() {
  const menuContainer = document.getElementById("menuBtn");
  const dropNavContainer = document.querySelector(".mob-dropnav_container");

  if (!menuContainer || !dropNavContainer) {
    console.warn("Dropdown menu elements not found");
    return;
  }

  let isOpen = false;

  const setOpenHeight = () => {
    if (isOpen) {
      const dropNav = dropNavContainer.querySelector(".dropnav");
      if (dropNav) {
        const height = dropNav.scrollHeight;
        dropNavContainer.style.height = `${height}px`;
      }
    }
  };

  const openMenu = () => {
    if (!isOpen) {
      isOpen = true;
      dropNavContainer.style.display = "block";
      requestAnimationFrame(() => {
        setOpenHeight();
        dropNavContainer.style.opacity = "1";
      });
    }
  };

  const closeMenu = () => {
    if (isOpen) {
      isOpen = false;
      dropNavContainer.style.height = "0";
      dropNavContainer.style.opacity = "0";
    }
  };

  const handleMenuClick = (event) => {
    event.stopPropagation();
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  const handleDocumentClick = (event) => {
    if (isOpen && !dropNavContainer.contains(event.target)) {
      closeMenu();
    }
  };

  const handleTransitionEnd = () => {
    if (!isOpen) {
      dropNavContainer.style.display = "none";
    }
  };

  menuContainer.addEventListener("click", handleMenuClick);
  document.addEventListener("click", handleDocumentClick);
  dropNavContainer.addEventListener("transitionend", handleTransitionEnd);

  window.addEventListener("resize", () => {
    if (isOpen) {
      setOpenHeight();
    }
  });
}

export default initDropdownMenu;
