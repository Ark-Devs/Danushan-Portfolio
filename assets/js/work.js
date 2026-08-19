/* ==================================================================
   THE ONLY FILE YOU NEED TO EDIT TO ADD OR CHANGE WORK
   ------------------------------------------------------------------
   One entry per project. The category filter builds itself from this
   list, so adding a project with cat:'Travel' makes a Travel filter
   button appear on its own. Order here is the order on the page.

     title     shown on the tile and in the lightbox
     cat       category label — exactly what the filter button shows
     client    brand name, shown under the description
     year      optional, e.g. '2025'
     thumb     square still: 'assets/img/knorr.jpg'
               leave '' and a lettered placeholder is drawn instead
     yt        YouTube video id — the bit after v= or youtu.be/
               leave '' and the lightbox says "not linked yet"
     vertical  true for 9:16 reels, false for 16:9 films
     desc      the description shown in the lightbox
     gallery   optional list of stills for a photo set, e.g.
                 gallery: ['assets/img/luxe-pods/01.jpg', ...]
               they appear as a filmstrip under the player and each one
               opens in the frame. Missing files draw a placeholder, so
               you can list the paths first and add the photos later.

   Projects below are taken from behance.net/dhanushvijayar1.
   The descriptions are first drafts — rewrite them in Dhanushan's
   own words, they are the one thing here I could not source.
   ================================================================== */

window.WORK = [
  {
    title: 'Heritance Aarah',
    cat: 'Hotels',
    client: 'Heritance Aarah',
    year: '',
    thumb: '',
    yt: '',
    vertical: true,
    desc: 'Resort film and stills covering the property, the rooms and the guest experience.'
  },
  {
    title: 'Taj Navratna',
    cat: 'Hotels',
    client: 'Taj Samudra',
    year: '',
    thumb: '',
    yt: '',
    vertical: true,
    desc: 'Restaurant content for Navratna, the Indian fine-dining room at Taj Samudra, Colombo.'
  },
  {
    title: 'Luxe Pods',
    cat: 'Hotels',
    client: 'Luxe Pods',
    year: '',
    thumb: '',
    yt: '',
    vertical: true,
    gallery: [
      'assets/img/luxe-pods/01.jpg',
      'assets/img/luxe-pods/02.jpg',
      'assets/img/luxe-pods/03.jpg',
      'assets/img/luxe-pods/04.jpg',
      'assets/img/luxe-pods/05.jpg',
      'assets/img/luxe-pods/06.jpg',
      'assets/img/luxe-pods/07.jpg',
      'assets/img/luxe-pods/08.jpg'
    ],
    desc: 'Accommodation brand shoot built around the pod interiors and their setting.'
  },
  {
    title: 'Knorr',
    cat: 'Food',
    client: 'Knorr',
    year: '',
    thumb: '',
    yt: '',
    vertical: true,
    desc: 'Food content for Knorr — preparation, plating and pack shots.'
  },
  {
    title: 'Imorich Ice Cream',
    cat: 'Food',
    client: 'Imorich',
    year: '',
    thumb: '',
    yt: '',
    vertical: true,
    desc: 'Product and lifestyle content for the Imorich ice cream range.'
  },
  {
    title: 'Lactogrow',
    cat: 'Commercial',
    client: 'Lactogrow',
    year: '',
    thumb: '',
    yt: '',
    vertical: true,
    desc: 'Brand content for Lactogrow.'
  },
  {
    title: 'Roofvo',
    cat: 'Commercial',
    client: 'Roofvo',
    year: '',
    thumb: '',
    yt: '',
    vertical: true,
    desc: 'Commercial shoot for Roofvo.'
  },
  {
    title: 'Luv Paradise',
    cat: 'Commercial',
    client: 'Zarees Interior',
    year: '',
    thumb: '',
    yt: '',
    vertical: true,
    desc: 'Interior film for Luv Paradise by Zarees Interior, shot across the finished space.'
  },
  {
    title: 'Key Jeans',
    cat: 'Fashion',
    client: 'Key Jeans',
    year: '',
    thumb: '',
    yt: '',
    vertical: true,
    gallery: [
      'assets/img/key-jeans/01.jpg',
      'assets/img/key-jeans/02.jpg',
      'assets/img/key-jeans/03.jpg',
      'assets/img/key-jeans/04.jpg'
    ],
    desc: 'Apparel campaign for Key Jeans — fit, fabric and movement.'
  },
  {
    title: 'CBL Lifestyle',
    cat: 'Fashion',
    client: 'CBL',
    year: '',
    thumb: '',
    yt: '',
    vertical: true,
    desc: 'Lifestyle campaign content for CBL.'
  },
  {
    title: 'Chinwag Lifestyle',
    cat: 'Fashion',
    client: 'Chinwag',
    year: '',
    thumb: '',
    yt: '',
    vertical: true,
    desc: 'Lifestyle brand shoot for Chinwag.'
  },
  {
    title: 'Leather Collection',
    cat: 'Product',
    client: '',
    year: '',
    thumb: '',
    yt: '',
    vertical: false,
    gallery: [
      'assets/img/leather/01.jpg',
      'assets/img/leather/02.jpg',
      'assets/img/leather/03.jpg',
      'assets/img/leather/04.jpg',
      'assets/img/leather/05.jpg',
      'assets/img/leather/06.jpg'
    ],
    desc: 'Studio product photography for a leather goods collection.'
  }
];

/* Links and the hero reel, kept here so everything editable is in one file. */
window.SITE = {
  instagram: 'https://www.instagram.com/dhanuu.vj',
  behance:   'https://www.behance.net/dhanushvijayar1',
  whatsapp:  'https://wa.me/94701449127',
  phone:     '+94 70 144 9127',

  /* Hero showreel.
     Put the vertical reel at assets/video/showreel.mp4 and it plays there.
     If that file is missing, the YouTube id below is used instead so the
     hero is never an empty rectangle. */
  reelFile: 'assets/video/showreel.mp4',
  reelPoster: 'assets/img/showreel-poster.jpg',
  reelYouTube: '0K_cYUzxHdE'
};
