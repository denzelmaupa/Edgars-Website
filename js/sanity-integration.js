/**
 * Sanity.io CMS Integration for Edgars Stores
 * Provides dynamic fetching and rendering of catalog items.
 */

const SANITY_CONFIG = {
  projectId: 'u63a6xv5',
  dataset: 'production',
  apiVersion: '2023-08-01',
  useCdn: true
};

/**
 * Builds the Sanity API URL for a GROQ query
 */
function getSanityQueryUrl(query) {
  const encodedQuery = encodeURIComponent(query);
  return `https://${SANITY_CONFIG.projectId}.apicdn.sanity.io/v${SANITY_CONFIG.apiVersion}/data/query/${SANITY_CONFIG.dataset}?query=${encodedQuery}`;
}

/**
 * Generates the HTML for a single product card
 */
function createProductHtml(product) {
  const imageUrl = product.imageUrl || 'images/products/product-placeholder.png';
  const brand = product.brand || 'Edgars';
  const title = product.title || '';

  return `
    <div class="prd prd-has-loader prd-new prd-popular">
      <div class="prd-inside">
        <div class="prd-img-area">
          <a href="#" class="prd-img">
            <img src="${imageUrl}" srcset="${imageUrl}" alt="${title}" class="js-prd-img lazyloaded" />
          </a>
          <div class="gdw-loader"></div>
        </div>
        <div class="prd-info">
          <div class="prd-tag prd-hidemobile">
            <a href="#">${brand}</a>
          </div>
          <h2 class="prd-title">
            <a href="#">${title}</a>
          </h2>
          <div class="prd-rating prd-hidemobile">
            <i class="icon-star fill"></i>
            <i class="icon-star fill"></i>
            <i class="icon-star fill"></i>
            <i class="icon-star fill"></i>
            <i class="icon-star"></i>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Loads products for the Home Page Showcase Carousel
 */
function loadHomePageProducts() {
  console.log('[Sanity] loadHomePageProducts started.');
  const $carousel = $('#tabCarousel-01');
  if (!$carousel.length) {
    console.warn('[Sanity] Home Page Carousel container (#tabCarousel-01) not found on this page.');
    return;
  }

  // Unmute the container first so it is visible
  $carousel.closest('.holder').show();

  const query = `*[_type == "product"] | order(_createdAt desc)[0...12] {
    _id,
    title,
    brand,
    category,
    "imageUrl": image.asset->url
  }`;

  const queryUrl = getSanityQueryUrl(query);
  console.log('[Sanity] Fetching home page products. URL:', queryUrl);

  fetch(queryUrl)
    .then(response => {
      console.log('[Sanity] Home page fetch response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      const products = data.result || [];
      console.log('[Sanity] Home page query results:', products);
      if (products.length === 0) {
        // Keep hidden if no products are configured
        $carousel.closest('.holder').hide();
        return;
      }

      // Destroy existing slick carousel if initialized
      if ($carousel.hasClass('slick-initialized')) {
        console.log('[Sanity] Destroying existing slick instance.');
        $carousel.slick('unslick');
      }

      // Render cards
      let html = '';
      products.forEach(product => {
        html += createProductHtml(product);
      });
      $carousel.html(html);

      // Force dynamic loaded status on products
      $carousel.find('.prd img').on('load', function() {
        $(this).closest('.prd').addClass('loaded');
      }).each(function() {
        if (this.complete) {
          $(this).trigger('load');
        }
      });

      // Re-initialize slick carousel
      const slidesToShow = parseInt($carousel.attr('data-to-show')) || 4;
      const appendArrows = $carousel.parent().find('.carousel-arrows').length 
        ? $carousel.parent().find('.carousel-arrows') 
        : $carousel.closest('.holder').find('.carousel-arrows');

      console.log('[Sanity] Initializing slick with', products.length, 'products.');
      $carousel.slick({
        slidesToShow: slidesToShow,
        slidesToScroll: slidesToShow,
        arrows: true,
        appendArrows: appendArrows,
        adaptiveHeight: true,
        swipe: true,
        speed: 400,
        infinite: false,
        responsive: [
          {
            breakpoint: 992,
            settings: {
              slidesToShow: 3,
              slidesToScroll: 1
            }
          },
          {
            breakpoint: 768,
            settings: {
              slidesToShow: 2,
              slidesToScroll: 1
            }
          }
        ]
      });

      // Trigger Goodwin imageLoaded if available
      if (window.GOODWIN && window.GOODWIN.initialization && typeof window.GOODWIN.initialization.imageLoaded === 'function') {
        console.log('[Sanity] Triggering Goodwin imageLoaded for home page carousel.');
        window.GOODWIN.initialization.imageLoaded($carousel.find('.prd'));
      }

      // Trigger Goodwin catalog post-rendering routines
      if (window.GOODWIN && window.GOODWIN.catalog && typeof window.GOODWIN.catalog.postAjaxCatalog === 'function') {
        console.log('[Sanity] Triggering Goodwin postAjaxCatalog for home page carousel.');
        window.GOODWIN.catalog.postAjaxCatalog();
      }
    })
    .catch(error => {
      console.error('[Sanity] Error fetching home page products:', error);
    });
}

/**
 * Loads products for a specific Category Page Grid
 */
function loadCategoryProducts(categoryName) {
  console.log(`[Sanity] loadCategoryProducts started for category: "${categoryName}"`);
  const $grid = $('.js-category-grid');
  if (!$grid.length) {
    console.warn('[Sanity] Category grid container (.js-category-grid) not found on this page.');
    return;
  }

  const query = `*[_type == "product" && category == "${categoryName}"] | order(_createdAt desc) {
    _id,
    title,
    brand,
    category,
    "imageUrl": image.asset->url
  }`;

  const queryUrl = getSanityQueryUrl(query);
  console.log(`[Sanity] Fetching products for category "${categoryName}". URL:`, queryUrl);

  fetch(queryUrl)
    .then(response => {
      console.log(`[Sanity] Category "${categoryName}" fetch response status:`, response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      const products = data.result || [];
      console.log(`[Sanity] Products loaded for category "${categoryName}":`, products);
      
      if (products.length === 0) {
        console.warn(`[Sanity] No products returned for category "${categoryName}".`);
        $grid.html('<div class="col-12 text-center py-5"><h3>No products found in this category.</h3><p>Use Sanity Studio to add products to this category.</p></div>');
        $('.show-more').hide();
        return;
      }

      // Hide the static pagination & load-more buttons
      $('.show-more').hide();

      // Render cards
      let html = '';
      products.forEach(product => {
        html += createProductHtml(product);
      });
      console.log(`[Sanity] Injecting ${products.length} product(s) into category grid.`);
      $grid.html(html);

      // Force dynamic loaded status on products
      $grid.find('.prd img').on('load', function() {
        $(this).closest('.prd').addClass('loaded');
      }).each(function() {
        if (this.complete) {
          $(this).trigger('load');
        }
      });

      // Trigger Goodwin imageLoaded if available
      if (window.GOODWIN && window.GOODWIN.initialization && typeof window.GOODWIN.initialization.imageLoaded === 'function') {
        console.log('[Sanity] Triggering Goodwin imageLoaded.');
        window.GOODWIN.initialization.imageLoaded($grid.find('.prd'));
      }

      // Trigger Goodwin catalog post-rendering routines
      if (window.GOODWIN && window.GOODWIN.catalog && typeof window.GOODWIN.catalog.postAjaxCatalog === 'function') {
        console.log('[Sanity] Triggering Goodwin postAjaxCatalog.');
        window.GOODWIN.catalog.postAjaxCatalog();
      }
    })
    .catch(error => {
      console.error(`[Sanity] Error fetching category products for "${categoryName}":`, error);
    });
}


