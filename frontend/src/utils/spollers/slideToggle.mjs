import { slideUp, slideDown } from "./filterSpoller.mjs"

let toggle = (target, duration = 500) => {
   target.hidden ? slideDown(target, duration) : slideUp(target, duration)
}

export const slideToggle = () => {
   document.addEventListener("click", (e) => {
      const targetElement = e.target
      if (targetElement.closest('[data-spoller]')) {
         const currentElement = targetElement.closest('[data-spoller]');
         if (!currentElement.nextElementSibling.classList.contains('--sliding')) {
            currentElement.classList.toggle('active');
         }
         toggle(currentElement.nextElementSibling);
      }
   })
}