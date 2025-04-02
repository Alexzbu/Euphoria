
export let slideDown = (target, duration = 500) => {
   if (!target.classList.contains('--sliding')) {
      target.classList.add('--sliding');
      target.hidden = false;
      let height = target.offsetHeight;

      target.style.paddingTop = 0;
      target.style.paddingBottom = 0;
      target.style.marginTop = 0;
      target.style.marginBottom = 0;

      target.style.overflow = 'hidden';
      target.style.height = 0;

      void target.offsetHeight;

      target.style.transitionProperty = `height, margin, padding`;
      target.style.transitionDuration = `${duration}ms`;

      target.style.height = `${height}px`;

      target.style.removeProperty('padding-top')
      target.style.removeProperty('padding-bottom')
      target.style.removeProperty('margin-bottom')
      target.style.removeProperty('margin-top')

      setTimeout(() => {
         target.style.removeProperty('height')
         target.style.removeProperty('overflow')
         target.style.removeProperty('transition-duration')
         target.style.removeProperty('transition-property')
         target.classList.remove('--sliding');
      }, duration);
   }
}
export let slideUp = (target, duration = 500) => {

   if (!target.classList.contains('--sliding')) {
      target.classList.add('--sliding');
      let height = target.offsetHeight;

      target.style.transitionProperty = `height, margin, padding`;
      target.style.transitionDuration = `${duration}ms`;
      target.style.height = `${height}px`;

      void target.offsetHeight;

      target.style.overflow = 'hidden';
      target.style.paddingTop = 0;
      target.style.paddingBottom = 0;
      target.style.marginTop = 0;
      target.style.marginBottom = 0;

      target.style.height = 0;

      setTimeout(() => {
         target.style.removeProperty('padding-top')
         target.style.removeProperty('padding-bottom')
         target.style.removeProperty('margin-bottom')
         target.style.removeProperty('margin-top')

         target.style.removeProperty('height')
         target.style.removeProperty('overflow')
         target.style.removeProperty('transition-duration')
         target.style.removeProperty('transition-property')
         target.classList.remove('--sliding');
         target.hidden = true;
      }, duration);
   }
}

// const spollers = document.querySelectorAll('[data-spoller]')

// if (spollers.length) {
//    spollers.forEach(spoller => {
//       spoller.dataset.spoller !== 'open' ? spoller.nextElementSibling.hidden = true : spoller.classList.add('active')
//    })
// }

export const filterSpoller = () => {
   const filterTitle = document.querySelector('.filter__title')
   if (filterTitle) {
      //window.addEventListener('resize', someFunc);
      const breakPointValue = filterTitle.dataset.spollerMedia;
      const breakPoint = breakPointValue ? `(${breakPointValue.split(',')[0]}-width:${breakPointValue.split(',')[1]}px)` : null
      if (breakPoint) {
         const matchMedia = window.matchMedia(breakPoint)
         if (matchMedia.matches) {
            slideUp(filterTitle.nextElementSibling, 0)
            filterTitle.classList.remove('active')
         } else {
            slideDown(filterTitle.nextElementSibling, 0)
            filterTitle.classList.add('active')
         }
         matchMedia.addEventListener("change", (e) => {
            const isTrue = e.matches
            if (isTrue) {
               slideUp(filterTitle.nextElementSibling)
               filterTitle.classList.remove('active')
            } else {
               slideDown(filterTitle.nextElementSibling)
               filterTitle.classList.add('active')
            }
         })
      }
   }
}