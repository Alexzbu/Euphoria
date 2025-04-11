// Строгий режим
"use strict"

setTimeout(() => {

	document.addEventListener("click", documentActions);

	function documentActions(e) {
		const targetElement = e.target;

		if (targetElement.closest('.icon-menu')) {
			document.body.classList.toggle('menu-open');
		}

		if (targetElement.closest('.rating__input')) {
			const currentElement = targetElement.closest('.rating__input');
			const rating = currentElement.closest('.rating');
			if (rating.classList.contains('rating--set')) {
				starRatingGet(rating, currentElement);
			}
		}
		if (targetElement.closest('[data-tabs-button]')) {
			const currentElement = targetElement.closest('[data-tabs-button]');
			setTab(currentElement);
		}
	}

	// Rating
	const ratings = document.querySelectorAll('[data-rating]')
	if (ratings) {
		ratings.forEach(rating => {
			const currentValue = +rating.dataset.rating;
			currentValue ? starRatingSet(rating, currentValue) : null;
		});
	}
	function starRatingGet(rating, currentElement) {
		const ratingValue = +currentElement.value;
		// Тут відправка оцінки (ratingValue) на бекенд...
		// Уявімо, що ми отримали середню оцінку 3.2
		const resultRating = 3.2;
		starRatingSet(rating, resultRating);
	}
	function starRatingSet(rating, value) {
		const ratingItems = rating.querySelectorAll('.rating__item');
		const resultFullItems = parseInt(value);
		const resultPartItem = value - resultFullItems;

		ratingItems.forEach((ratingItem, index) => {
			ratingItem.classList.remove('active');
			ratingItem.querySelector('span') ? ratingItems[index].querySelector('span').remove() : null;

			if (index <= (resultFullItems - 1)) {
				ratingItem.classList.add('active');
			}
			if (index === resultFullItems && resultPartItem) {
				ratingItem.insertAdjacentHTML("beforeend", `<span style="width:${resultPartItem * 100}%"></span>`)
			}
		});
	}

	// Spollers



	// Tabs
	function setTab(tabElement) {
		const tabsParent = tabElement.closest('[data-tabs]');

		const tabsButtons = Array.from(tabsParent.querySelectorAll('[data-tabs-button]'));
		const tabsActiveButton = tabsParent.querySelector('[data-tabs-button].active');
		tabsActiveButton.classList.remove('active');
		tabElement.classList.add('active');

		const currentButtonIndex = tabsButtons.indexOf(tabElement);
		const tabsElements = tabsParent.querySelectorAll('[data-tabs-element]');

		tabsElements.forEach(tabsElement => {
			tabsElement.hidden = true;
		});

		tabsElements[currentButtonIndex].hidden = false;

	}

}, 300);
