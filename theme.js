/* global Spicetify, FastAverageColor */
(function bloom() {
  function waitForElement(els, func, timeout = 100) {
    const queries = els.map((el) => document.querySelector(el));
    if (queries.every((a) => a)) {
      func();
    } else if (timeout > 0) {
      setTimeout(waitForElement, 300, els, func, timeout - 1);
    }
  }

  waitForElement([
    '.main-rootlist-rootlistItem',
  ], () => {
    const mainRootlistWrapper = document.getElementsByClassName('main-rootlist-wrapper')[0];
    mainRootlistWrapper.style.height = `${mainRootlistWrapper.offsetHeight * 2}px`;
    const cache = new Map();

    async function fetchPlaylistData(url) {
      const response = await Spicetify.CosmosAsync.get(url);
      const { items, next } = response;
      return [...items, ...(next ? await fetchPlaylistData(next) : [])];
    }

    async function addPlaylistIcons() {
      while (!Spicetify || !Spicetify.Platform || !Spicetify.CosmosAsync) {
        // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      async function updatePlaylistList(playlistData) {
        const playlistElements = await new Promise((resolve) => {
          const interval = setInterval(() => {
            const elements = document.querySelectorAll('#spicetify-playlist-list li a');
            if (elements.length > 0) {
              clearInterval(interval);
              resolve(Array.from(elements));
            }
          }, 100);
        });

        for (let i = 0; i < playlistElements.length; i += 1) {
          const [id] = playlistElements[i].href.split('/').slice(-1);
          const [type] = playlistElements[i].href.split('/').slice(-2, -1);
          let icon = cache.get(id);
          if (!icon) {
            switch (type) {
              case 'playlist': {
                const playlist = playlistData.find((p) => p.id === id);
                const image = playlist ? playlist.images[0] || {} : {};
                icon = {
                  src: image.url || 'https://cdn.jsdelivr.net/gh/nimsandu/spicetify-bloom@master/assets/fluentui-system-icons/ic_fluent_music_note_2_24_filled.svg',
                  size: '50px',
                };
                if (!image.url) {
                  icon.size = '45px';
                }
                cache.set(id, icon);
                break;
              }

              case 'folder':
                icon = {
                  src: 'https://cdn.jsdelivr.net/gh/nimsandu/spicetify-bloom@master/assets/fluentui-system-icons/ic_fluent_folder_24_filled.svg',
                };
                icon.size = '45px';
                cache.set(id, icon);
                break;

              default:
                break;
            }
          }

          if (icon.src) {
            playlistElements[i].style.backgroundImage = `url('${icon.src}')`;
            playlistElements[i].style.backgroundRepeat = 'no-repeat';
            playlistElements[i].style.backgroundSize = `${icon.size}`;
            playlistElements[i].style.backgroundPosition = 'center';
          }
        }
      }

      const playlistList = await new Promise((resolve) => {
        const interval = setInterval(() => {
          const element = document.querySelector('#spicetify-playlist-list');
          if (element) {
            clearInterval(interval);
            resolve(element);
          }
        }, 100);
      });

      const playlistData = await fetchPlaylistData('https://api.spotify.com/v1/me/playlists?limit=50');
      const observer = new MutationObserver(async () => {
        observer.disconnect();
        await updatePlaylistList(playlistData);
        observer.observe(playlistList, { childList: true, subtree: true });
      });
      await updatePlaylistList(playlistData);
      observer.observe(playlistList, { childList: true, subtree: true });
    }

    addPlaylistIcons();
  });

  waitForElement(['.main-navBar-navBarLink'], () => {
    const navBarItems = document.getElementsByClassName('main-navBar-navBarLink');
    for (let i = 0; i < navBarItems.length; i += 1) {
      const div = document.createElement('div');
      div.classList.add('navBar-navBarLink-accent');
      navBarItems[i].appendChild(div);
    }
  });

  const textColor = getComputedStyle(document.documentElement).getPropertyValue('--spice-text');
  if (textColor === ' #000000') {
    document.documentElement.style.setProperty('--filter-brightness', 0);
  }

  const interval = setInterval(() => {
    if (
      typeof Spicetify.Platform === 'undefined' || (
        typeof Spicetify.Platform.Translations.play === 'undefined'
        && typeof Spicetify.Platform.Translations.pause === 'undefined'
      )
    ) return;
    clearInterval(interval);
    const playButtonStyle = document.createElement('style');

    function cleanLabel(label) {
      const cleanedLabel = label.replace(/[{0}{1}«»”“]/g, '').trim();
      return cleanedLabel;
    }

    let playlistPlayLabel = Spicetify.Platform.Translations['playlist.a11y.play'];
    playlistPlayLabel = cleanLabel(playlistPlayLabel);
    let playlistPauseLabel = Spicetify.Platform.Translations['playlist.a11y.pause'];
    playlistPauseLabel = cleanLabel(playlistPauseLabel);

    const tracklistPlayLabel = Spicetify.Platform.Translations['tracklist.a11y.play'];
    let tracklistPlayLabelOne;
    let tracklistPlayLabelTwo;
    // eslint-disable-next-line no-underscore-dangle
    if (['zh-CN', 'zh-TW', 'am', 'fi'].includes(Spicetify.Locale._locale)) {
      [tracklistPlayLabelOne, tracklistPlayLabelTwo] = tracklistPlayLabel.split('{1}');
    } else {
      [tracklistPlayLabelOne, tracklistPlayLabelTwo] = tracklistPlayLabel.split('{0}');
    }
    tracklistPlayLabelOne = cleanLabel(tracklistPlayLabelOne);
    tracklistPlayLabelTwo = cleanLabel(tracklistPlayLabelTwo);

    playButtonStyle.innerHTML = `
      .main-playButton-button[aria-label*="${Spicetify.Platform.Translations.play}"],
      .main-playButton-PlayButton>button[aria-label*="${Spicetify.Platform.Translations.play}"],
      .main-playPauseButton-button[aria-label="${Spicetify.Platform.Translations.play}"],
      .main-playPauseButton-button[aria-label="${Spicetify.Platform.Translations['playback-control.play']}"],
      .main-trackList-rowPlayPauseButton[aria-label*="${Spicetify.Platform.Translations.play}"],
      .main-trackList-rowImagePlayButton[aria-label*="${tracklistPlayLabelOne}"][aria-label*="${tracklistPlayLabelTwo}"],
      .main-playButton-PlayButton>button[aria-label*="${playlistPlayLabel}"] {
        background-color: var(--spice-text) !important;
        -webkit-mask-image: url('https://cdn.jsdelivr.net/gh/nimsandu/spicetify-bloom@master/assets/fluentui-system-icons/ic_fluent_play_24_filled.svg') !important;
      }
      .main-playButton-button[aria-label*="${Spicetify.Platform.Translations.pause}"],
      .main-playButton-PlayButton>button[aria-label*="${Spicetify.Platform.Translations.pause}"],
      .main-playPauseButton-button[aria-label*="${Spicetify.Platform.Translations.pause}"],
      .main-playPauseButton-button[aria-label="${Spicetify.Platform.Translations['playback-control.pause']}"],
      .main-trackList-rowPlayPauseButton[aria-label*="${Spicetify.Platform.Translations.pause}"],
      .main-trackList-rowImagePlayButton[aria-label*="${Spicetify.Platform.Translations.pause}"],
      .main-playButton-PlayButton>button[aria-label*="${playlistPauseLabel}"] {
        background-color: var(--spice-text) !important;
        -webkit-mask-image: url('https://cdn.jsdelivr.net/gh/nimsandu/spicetify-bloom@master/assets/fluentui-system-icons/ic_fluent_pause_16_filled.svg') !important;
      }`;
    document.getElementsByTagName('head')[0].appendChild(playButtonStyle);
  }, 10);

  waitForElement(['body'], () => {
    const facScript = document.createElement('script');
    facScript.src = 'https://unpkg.com/fast-average-color/dist/index.browser.min.js';
    facScript.defer = true;
    facScript.type = 'text/javascript';
    document.body.appendChild(facScript);
  });

  let previousAlbumUri;

  async function updateLyricsBackdrop() {
    async function calculateBrightnessCoefficient(image) {
      try {
        const fac = new FastAverageColor();
        // ignore colors darker than 50% by HSB, because 0.5 is a brightness threshold
        const averageColor = await fac.getColorAsync(image, {
          ignoredColor: [[0, 0, 0, 255, 125]],
        });
        fac.destroy();

        // slice(0, 3) - remove alpha channel value
        let brightness = Math.max(...averageColor.value.slice(0, 3));
        brightness = (brightness / 255).toFixed(1);

        return brightness > 0.5 ? 1 - (brightness - 0.5) : 1;
      } catch (error) {
        return 0.65;
      }
    }

    async function calculateSaturationCoefficient(originalImage, canvasImage) {
      function getSaturation(color) {
        const { value } = color;
        const max = Math.max(...value.slice(0, 3));
        const min = Math.min(...value.slice(0, 3));
        const delta = max - min;
        return max !== 0 ? (delta / max) : 0;
      }

      try {
        const fac = new FastAverageColor();
        const [averageOriginalColor, averageCanvasColor] = await Promise.all([
          // ignore almost black colors
          fac.getColorAsync(originalImage, { ignoredColor: [[0, 0, 0, 255, 10]] }),
          fac.getColorAsync(canvasImage), { ignoredColor: [[0, 0, 0, 255, 10]] },
        ]);
        fac.destroy();

        const [averageOriginalSaturation, averageCanvasSaturation] = [
          getSaturation(averageOriginalColor),
          getSaturation(averageCanvasColor),
        ];

        let saturationCoefficient;

        if (averageCanvasSaturation < averageOriginalSaturation) {
          saturationCoefficient = averageOriginalSaturation / averageCanvasSaturation;
        } else {
          // do not change saturation if backdrop is more saturated than the original artwork or equal
          saturationCoefficient = 1;
        }

        const finalSaturation = (averageCanvasSaturation * saturationCoefficient).toFixed(2);

        // try to detect and fix oversaturated backdrop
        if (finalSaturation > 0.75) {
          saturationCoefficient = 1 - (averageCanvasSaturation - 0.75);
        }

        // try to detect and fix undersaturated backdrop
        if (finalSaturation < 0.45 && averageOriginalSaturation > 0.1) {
          saturationCoefficient += 0.45 - finalSaturation;
        }

        // coefficient threshold
        if (saturationCoefficient > 1.5) {
          saturationCoefficient = 1.5;
        }

        return saturationCoefficient.toFixed(1);
      } catch (error) {
        return 1.4;
      }
    }

    // necessary because backdrop edges become transparent due to blurring
    async function calculateContextDrawValues(blur, canvas) {
      const drawWidth = canvas.width + blur * 2;
      const drawHeight = canvas.height + blur * 2;
      const drawX = 0 - blur;
      const drawY = 0 - blur;
      return [drawWidth, drawHeight, drawX, drawY];
    }

    async function getImageFromCanvas(canvas) {
      const image = new Image();
      image.src = canvas.toDataURL();
      return image;
    }

    waitForElement(['#lyrics-backdrop'], () => {
      // don't animate backdrop if artwork didn't change
      if (previousAlbumUri === Spicetify.Player.data.track.metadata.album_uri) {
        return;
      }
      previousAlbumUri = Spicetify.Player.data.track.metadata.album_uri;

      const lyricsBackdropPrevious = document.getElementById('lyrics-backdrop');
      const contextPrevious = lyricsBackdropPrevious.getContext('2d');
      const blur = 20;

      // don't animate backdrop if it is hidden
      // if skip the image change completely, then if the user tries to quickly hide the lyrics immediately after changing the track and opening the lyrics, the backdrop will be hidden with a delay
      if (lyricsBackdropPrevious.style.display === 'none') {
        const lyricsBackdropImage = new Image();
        lyricsBackdropImage.src = Spicetify.Player.data.track.metadata.image_xlarge_url;
        lyricsBackdropImage.onload = async () => {
          const [
            drawWidth, drawHeight, drawX, drawY,
          ] = await calculateContextDrawValues(blur, lyricsBackdropPrevious);
          // eslint-disable-next-line max-len
          contextPrevious.clearRect(0, 0, lyricsBackdropPrevious.width, lyricsBackdropPrevious.height);
          contextPrevious.drawImage(lyricsBackdropImage, drawX, drawY, drawWidth, drawHeight);

          // update filters
          const lyricsBackdropCanvasImage = await getImageFromCanvas(lyricsBackdropPrevious);
          const [brightnessCoefficient, saturationCoefficient] = await Promise.all([
            calculateBrightnessCoefficient(lyricsBackdropCanvasImage),
            calculateSaturationCoefficient(lyricsBackdropImage, lyricsBackdropCanvasImage),
          ]);
          lyricsBackdropPrevious.style.filter = `saturate(${saturationCoefficient}) brightness(${brightnessCoefficient})`;
        };
        return;
      }

      const lyricsBackdrop = document.createElement('canvas');
      lyricsBackdrop.id = 'lyrics-backdrop';
      lyricsBackdropPrevious.insertAdjacentElement('beforebegin', lyricsBackdrop);
      const context = lyricsBackdrop.getContext('2d');

      contextPrevious.globalCompositeOperation = 'destination-out';
      context.imageSmoothingEnabled = false;
      context.filter = `blur(${blur}px)`;

      const lyricsBackdropImage = new Image();
      lyricsBackdropImage.src = Spicetify.Player.data.track.metadata.image_xlarge_url;

      lyricsBackdropImage.onload = async () => {
        const [
          drawWidth, drawHeight, drawX, drawY,
        ] = await calculateContextDrawValues(blur, lyricsBackdrop);
        context.drawImage(lyricsBackdropImage, drawX, drawY, drawWidth, drawHeight);

        const lyricsBackdropCanvasImage = await getImageFromCanvas(lyricsBackdrop);

        const [brightnessCoefficient, saturationCoefficient] = await Promise.all([
          calculateBrightnessCoefficient(lyricsBackdropCanvasImage),
          calculateSaturationCoefficient(lyricsBackdropImage, lyricsBackdropCanvasImage),
        ]);

        lyricsBackdrop.style.filter = `saturate(${saturationCoefficient}) brightness(${brightnessCoefficient})`;

        // eslint-disable-next-line max-len
        const maxRadius = Math.ceil(Math.sqrt((lyricsBackdropPrevious.width ** 2 + lyricsBackdropPrevious.height ** 2)) / 2);
        const centerX = (lyricsBackdropPrevious.width / 2);
        const centerY = (lyricsBackdropPrevious.height / 2);
        let radius = 5;

        function animate() {
          if (radius >= maxRadius) {
            lyricsBackdropPrevious.remove();
            return;
          }

          contextPrevious.beginPath();
          contextPrevious.arc(centerX, centerY, radius, 0, Math.PI * 2);
          contextPrevious.closePath();
          contextPrevious.fill();

          radius += 5;
          requestAnimationFrame(animate);
        }
        animate();
      };
    });
  }

  // necessary for the first animation
  function fillBackdrop(backdrop) {
    const context = backdrop.getContext('2d');
    context.filter = 'blur(20px)';
    const rootStyles = getComputedStyle(document.documentElement);
    const spiceMain = rootStyles.getPropertyValue('--spice-rgb-main').split(',');
    context.fillStyle = `rgb(
      ${spiceMain[0].trim()},
      ${spiceMain[1]},
      ${spiceMain[2]}
      )`;
    context.fillRect(0, 0, backdrop.width, backdrop.height);
  }

  function pbRightCallback() {
    let lyricsBackdrop = document.getElementById('lyrics-backdrop');
    const lyricsButton = document.querySelector('.ZMXGDTbwxKJhbmEDZlYy');

    if (lyricsButton != null) {
      const lyricsActive = lyricsButton.getAttribute('data-active');
      if (lyricsActive === 'true') {
        if (lyricsBackdrop == null) {
          waitForElement(['.main-view-container__scroll-node > div.os-padding'], () => {
            const osPadding = document.querySelector('.main-view-container__scroll-node > div.os-padding');

            lyricsBackdrop = document.createElement('canvas');
            lyricsBackdrop.id = 'lyrics-backdrop';

            osPadding.parentNode.insertBefore(lyricsBackdrop, osPadding);

            fillBackdrop(lyricsBackdrop);

            updateLyricsBackdrop();
          }, 10);
        } else {
          lyricsBackdrop.style.display = 'unset';

          updateLyricsBackdrop();
        }
      } else if (lyricsBackdrop != null) {
        lyricsBackdrop.style.display = 'none';
      }
    } else if (lyricsBackdrop != null) {
      lyricsBackdrop.style.display = 'none';
    }
  }

  function lyricsCinemaCallback(mutationsList) {
    let lyricsBackdrop = document.getElementById('lyrics-backdrop');
    const lyricsCinema = mutationsList[0].target;

    if (lyricsCinema.classList.contains('AptbKyUcObu7QQ1sxqgb')) {
      if (lyricsBackdrop == null) {
        waitForElement(['.y7xcnM6yyOOrMwI77d5t'], () => {
          lyricsBackdrop = document.createElement('canvas');
          lyricsBackdrop.id = 'lyrics-backdrop';

          const container = document.querySelector('.y7xcnM6yyOOrMwI77d5t');
          lyricsCinema.insertBefore(lyricsBackdrop, container);

          fillBackdrop(lyricsBackdrop);

          updateLyricsBackdrop();
        });
      } else {
        lyricsBackdrop.style.display = 'unset';

        updateLyricsBackdrop();
      }
    } else if (lyricsBackdrop != null) {
      lyricsBackdrop.style.display = 'none';
    }
  }

  const features = JSON.parse(localStorage.getItem('spicetify-exp-features'));
  const rightSidebarLyricsEnabled = features.enableRightSidebarLyrics.value;
  const rightSidebarEnabled = features.enableRightSidebar.value;

  if (rightSidebarLyricsEnabled === false || rightSidebarEnabled === false) {
    waitForElement(['.mwpJrmCgLlVkJVtWjlI1'], () => {
      const pbRight = document.querySelector('.mwpJrmCgLlVkJVtWjlI1');
      const pbRightObserver = new MutationObserver(pbRightCallback);
      const pbRightObserverConfig = {
        attributes: true,
        childList: true,
        subtree: true,
      };
      pbRightObserver.observe(pbRight, pbRightObserverConfig);
    });
  } else {
    waitForElement(['.Root__lyrics-cinema'], () => {
      const lyricsCinema = document.querySelector('.Root__lyrics-cinema');
      const lyricsCinemaObserver = new MutationObserver(lyricsCinemaCallback);
      const lyricsCinemaObserverConfig = {
        attributes: true,
        attributeFilter: ['class'],
        childList: false,
        subtree: false,
      };
      lyricsCinemaObserver.observe(lyricsCinema, lyricsCinemaObserverConfig);
    });
  }

  Spicetify.Player.addEventListener('songchange', updateLyricsBackdrop);

  waitForElement(['main'], () => {
    function mainCallback() {
      waitForElement(['.x-categoryCard-image'], () => {
        const cards = document.querySelectorAll('.x-categoryCard-CategoryCard');
        const cardImages = document.querySelectorAll('.x-categoryCard-image');
        for (let i = 0; i < cards.length; i += 1) {
          let cardBackdrop = cardImages[i].previousSibling;
          if (cardBackdrop == null) {
            cardBackdrop = document.createElement('div');
            cardBackdrop.classList.add('x-categoryCard-backdrop');
            cardBackdrop.style.backgroundImage = `url(${cardImages[i].src})`;
            cardBackdrop.style.backgroundColor = `${cards[i].style.backgroundColor}`;
            cardImages[i].parentNode.insertBefore(cardBackdrop, cardImages[i]);
          }
        }
      });
    }

    const mainElement = document.querySelector('main');
    const mainObserver = new MutationObserver(mainCallback);
    const mainObserverConfig = {
      attributes: true,
      attributeFilter: ['aria-label'],
      childList: false,
      subtree: false,
    };
    mainObserver.observe(mainElement, mainObserverConfig);
  });
}());
