(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.baguetteBox = factory();
    }
}(this, function () {
    var leftArrow = '<svg width="44" height="60">' +
            '<polyline points="30 10 10 30 30 50" stroke="rgba(255,255,255,0.5)" stroke-width="4"' +
              'stroke-linecap="butt" fill="none" stroke-linejoin="round"/>' +
            '</svg>',
        rightArrow = '<svg width="44" height="60">' +
            '<polyline points="14 10 34 30 14 50" stroke="rgba(255,255,255,0.5)" stroke-width="4"' +
              'stroke-linecap="butt" fill="none" stroke-linejoin="round"/>' +
            '</svg>',
        closeX = '<svg width="30" height="30">' +
            '<g stroke="rgb(160, 160, 160)" stroke-width="4">' +
            '<line x1="5" y1="5" x2="25" y2="25"/>' +
            '<line x1="5" y1="25" x2="25" y2="5"/>' +
            '</g></svg>';
    var options = {}, defaults = {
        captions: true,
        fullScreen: false,
        noScrollbars: false,
        titleTag: false,
        buttons: 'auto',
        async: false,
        preload: 2,
        animation: 'slideIn',
        afterShow: null,
        afterHide: null,
        onChange: null,
        overlayBackgroundColor: 'rgba(0, 0, 0, .8)',
    };
    var supports = {};
    var overlay, slider, previousButton, nextButton, closeButton;
    var currentIndex = 0, currentGallery = -1;
    var touchStartX;
    var touchFlag = false;
    var regex = /.+\.(gif|jpe?g|png|webp)/i;
    var galleries = [];
    var imagesMap = [];
    var imagesElements = [];
    var imagedEventHandlers = {};
    var overlayClickHandler = function(event) {
        if(event.target && event.target.nodeName !== 'IMG' && event.target.nodeName !== 'FIGCAPTION')
            hideOverlay();
    };
    var previousButtonClickHandler = function(event) {
        event.stopPropagation ? event.stopPropagation() : event.cancelBubble = true;
        showPreviousImage();
    };
    var nextButtonClickHandler = function(event) {
        event.stopPropagation ? event.stopPropagation() : event.cancelBubble = true;
        showNextImage();
    };
    var closeButtonClickHandler = function(event) {
        event.stopPropagation ? event.stopPropagation() : event.cancelBubble = true;
        hideOverlay();
    };
    var touchstartHandler = function(event) {
        touchStartX = event.changedTouches[0].pageX;
    };
    var touchmoveHandler = function(event) {
        if(touchFlag)
            return;
        event.preventDefault ? event.preventDefault() : event.returnValue = false;
        touch = event.touches[0] || event.changedTouches[0];
        if(touch.pageX - touchStartX > 40) {
            touchFlag = true;
            showPreviousImage();
        } else if (touch.pageX - touchStartX < -40) {
            touchFlag = true;
            showNextImage();
        }
    };
    var touchendHandler = function(event) {
        touchFlag = false;
    };

    if(![].forEach) {
        Array.prototype.forEach = function(callback, thisArg) {
            for(var i = 0; i < this.length; i++)
                callback.call(thisArg, this[i], i, this);
        };
    }

    if(![].filter) {
        Array.prototype.filter = function(a, b, c, d, e) {
            c=this;d=[];for(e=0;e<c.length;e++)a.call(b,c[e],e,c)&&d.push(c[e]);return d;
        };
    }

    function run(selector, userOptions) {
        supports.transforms = testTransformsSupport();
        supports.svg = testSVGSupport();

        buildOverlay();
        bindImageClickListeners(selector, userOptions);
    }

    function bindImageClickListeners(selector, userOptions) {
        var gallery = document.querySelectorAll(selector);
        galleries.push(gallery);
        [].forEach.call(gallery, function(galleryElement) {
            if(userOptions && userOptions.filter)
                regex = userOptions.filter;
            var tags = galleryElement.getElementsByTagName('a');
            tags = [].filter.call(tags, function(element) {
                return regex.test(element.href);
            });

            var galleryID = imagesMap.length;
            imagesMap.push(tags);
            imagesMap[galleryID].options = userOptions;

            [].forEach.call(imagesMap[galleryID], function(imageElement, imageIndex) {
                var imageElementClickHandler = function(event) {
                    event.preventDefault ? event.preventDefault() : event.returnValue = false;
                    prepareOverlay(galleryID);
                    showOverlay(imageIndex);
                };
                imagedEventHandlers[galleryID + '_' + imageElement] = imageElementClickHandler;
                bind(imageElement, 'click', imageElementClickHandler);
            });
        });
    }

    function unbindImageClickListeners() {
        galleries.forEach(function(gallery) {
            [].forEach.call(gallery, function(galleryElement) {
                var galleryID = imagesMap.length - 1;
                [].forEach.call(imagesMap[galleryID], function(imageElement, imageIndex) {
                    unbind(imageElement, 'click', imagedEventHandlers[galleryID + '_' + imageElement]);
                });
                imagesMap.pop();
            });
        });
    }

    function buildOverlay() {
        overlay = getByID('baguetteBox-overlay');
        if(overlay) {
            slider = getByID('baguetteBox-slider');
            previousButton = getByID('previous-button');
            nextButton = getByID('next-button');
            closeButton = getByID('close-button');
            return;
        }

        overlay = create('div');
        overlay.id = 'baguetteBox-overlay';
        document.getElementsByTagName('body')[0].appendChild(overlay);
        slider = create('div');
        slider.id = 'baguetteBox-slider';
        overlay.appendChild(slider);
        previousButton = create('button');
        previousButton.id = 'previous-button';
        previousButton.innerHTML = supports.svg ? leftArrow : '&lt;';
        overlay.appendChild(previousButton);

        nextButton = create('button');
        nextButton.id = 'next-button';
        nextButton.innerHTML = supports.svg ? rightArrow : '&gt;';
        overlay.appendChild(nextButton);

        closeButton = create('button');
        closeButton.id = 'close-button';
        closeButton.innerHTML = supports.svg ? closeX : 'X';
        overlay.appendChild(closeButton);

        previousButton.className = nextButton.className = closeButton.className = 'baguetteBox-button';

        bindEvents();
    }

    function keyDownHandler(event) {
        switch(event.keyCode) {
            case 37: 
                showPreviousImage();
                break;
            case 39: 
                showNextImage();
                break;
            case 27: 
                hideOverlay();
                break;
        }
    }

    function bindEvents() {
        bind(overlay, 'click', overlayClickHandler);
        bind(previousButton, 'click', previousButtonClickHandler);
        bind(nextButton, 'click', nextButtonClickHandler);
        bind(closeButton, 'click', closeButtonClickHandler);
        bind(overlay, 'touchstart', touchstartHandler);
        bind(overlay, 'touchmove', touchmoveHandler);
        bind(overlay, 'touchend', touchendHandler);
    }

    function unbindEvents() {
        unbind(overlay, 'click', overlayClickHandler);
        unbind(previousButton, 'click', previousButtonClickHandler);
        unbind(nextButton, 'click', nextButtonClickHandler);
        unbind(closeButton, 'click', closeButtonClickHandler);
        unbind(overlay, 'touchstart', touchstartHandler);
        unbind(overlay, 'touchmove', touchmoveHandler);
        unbind(overlay, 'touchend', touchendHandler);
    }

    function prepareOverlay(galleryIndex) {
        if(currentGallery === galleryIndex)
            return;
        currentGallery = galleryIndex;
        setOptions(imagesMap[galleryIndex].options);
        while(slider.firstChild)
            slider.removeChild(slider.firstChild);
        imagesElements.length = 0;
        for(var i = 0, fullImage; i < imagesMap[galleryIndex].length; i++) {
            fullImage = create('div');
            fullImage.className = 'full-image';
            fullImage.id = 'baguette-img-' + i;
            imagesElements.push(fullImage);
            slider.appendChild(imagesElements[i]);
        }
    }

    function setOptions(newOptions) {
        if(!newOptions)
            newOptions = {};
        for(var item in defaults) {
            options[item] = defaults[item];
            if(typeof newOptions[item] !== 'undefined')
                options[item] = newOptions[item];
        }
        slider.style.transition = slider.style.webkitTransition = (options.animation === 'fadeIn' ? 'opacity .4s ease' :
            options.animation === 'slideIn' ? '' : 'none');
        if(options.buttons === 'auto' && ('ontouchstart' in window || imagesMap[currentGallery].length === 1))
            options.buttons = false;
        previousButton.style.display = nextButton.style.display = (options.buttons ? '' : 'none');
        overlay.style.backgroundColor = options.overlayBackgroundColor;
    }

    function showOverlay(chosenImageIndex) {
        if(options.noScrollbars)
            document.body.style.overflow = 'hidden';
        if(overlay.style.display === 'block')
            return;

        bind(document, 'keydown', keyDownHandler);
        currentIndex = chosenImageIndex;
        loadImage(currentIndex, function() {
            preloadNext(currentIndex);
            preloadPrev(currentIndex);
        });

        updateOffset();
        overlay.style.display = 'block';
        if(options.fullScreen)
            enterFullScreen();
        setTimeout(function() {
            overlay.className = 'visible';
            if(options.afterShow)
                options.afterShow();
        }, 50);
        if(options.onChange)
            options.onChange(currentIndex, imagesElements.length);
    }

    function enterFullScreen() {
        if(overlay.requestFullscreen)
            overlay.requestFullscreen();
        else if(overlay.webkitRequestFullscreen )
            overlay.webkitRequestFullscreen();
        else if(overlay.mozRequestFullScreen)
            overlay.mozRequestFullScreen();
    }

    function exitFullscreen() {
        if(document.exitFullscreen)
            document.exitFullscreen();
        else if(document.mozCancelFullScreen)
            document.mozCancelFullScreen();
        else if(document.webkitExitFullscreen)
            document.webkitExitFullscreen();
    }

    function hideOverlay() {
        if(options.noScrollbars)
            document.body.style.overflow = 'auto';
        if(overlay.style.display === 'none')
            return;

        unbind(document, 'keydown', keyDownHandler);
        overlay.className = '';
        setTimeout(function() {
            overlay.style.display = 'none';
            exitFullscreen();
            if(options.afterHide)
                options.afterHide();
        }, 500);
    }

    function loadImage(index, callback) {
        var imageContainer = imagesElements[index];
        if(typeof imageContainer === 'undefined')
            return;

        if(imageContainer.getElementsByTagName('img')[0]) {
            if(callback)
                callback();
            return;
        }

        imageElement = imagesMap[currentGallery][index];
        imageCaption = (typeof(options.captions) === 'function') ?
                            options.captions.call(imagesMap[currentGallery], imageElement) :
                            imageElement.getAttribute('data-caption') || imageElement.title;
        imageSrc = getImageSrc(imageElement);
        var figure = create('figure');
        var image = create('img');
        var figcaption = create('figcaption');
        imageContainer.appendChild(figure);
        figure.innerHTML = '<div class="spinner">' +
            '<div class="double-bounce1"></div>' +
            '<div class="double-bounce2"></div>' +
            '</div>';
        image.onload = function() {
            var spinner = document.querySelector('#baguette-img-' + index + ' .spinner');
            figure.removeChild(spinner);
            if(!options.async && callback)
                callback();
        };
        image.setAttribute('src', imageSrc);
        if(options.titleTag && imageCaption)
            image.title = imageCaption;
        figure.appendChild(image);
        if(options.captions && imageCaption) {
            figcaption.innerHTML = imageCaption;
            figure.appendChild(figcaption);
        }
        if(options.async && callback)
            callback();
    }

    function getImageSrc(image) {
        var result = imageElement.href;
        if(image.dataset) {
            var srcs = [];
            for(var item in image.dataset) {
                if(item.substring(0, 3) === 'at-' && !isNaN(item.substring(3)))
                    srcs[item.replace('at-', '')] = image.dataset[item];
            }
            keys = Object.keys(srcs).sort(function(a, b) {
                return parseInt(a) < parseInt(b) ? -1 : 1;
            });
            var width = window.innerWidth * window.devicePixelRatio;
            var i = 0;
            while(i < keys.length - 1 && keys[i] < width)
                i++;
            result = srcs[keys[i]] || result;
        }
        return result;
    }

    function showNextImage() {
        var returnValue;
        if(currentIndex <= imagesElements.length - 2) {
            currentIndex++;
            updateOffset();
            preloadNext(currentIndex);
            returnValue = true;
        } else if(options.animation) {
            slider.className = 'bounce-from-right';
            setTimeout(function() {
                slider.className = '';
            }, 400);
            returnValue = false;
        }
        if(options.onChange)
            options.onChange(currentIndex, imagesElements.length);
        return returnValue;
    }

    function showPreviousImage() {
        var returnValue;
        if(currentIndex >= 1) {
            currentIndex--;
            updateOffset();
            preloadPrev(currentIndex);
            returnValue = true;
        } else if(options.animation) {
            slider.className = 'bounce-from-left';
            setTimeout(function() {
                slider.className = '';
            }, 400);
            returnValue = false;
        }
        if(options.onChange)
            options.onChange(currentIndex, imagesElements.length);
        return returnValue;
    }

    function updateOffset() {
        var offset = -currentIndex * 100 + '%';
        if(options.animation === 'fadeIn') {
            slider.style.opacity = 0;
            setTimeout(function() {
                supports.transforms ?
                    slider.style.transform = slider.style.webkitTransform = 'translate3d(' + offset + ',0,0)'
                    : slider.style.left = offset;
                slider.style.opacity = 1;
            }, 400);
        } else {
            supports.transforms ?
                slider.style.transform = slider.style.webkitTransform = 'translate3d(' + offset + ',0,0)'
                : slider.style.left = offset;
        }
    }

    function testTransformsSupport() {
        var div = create('div');
        return typeof div.style.perspective !== 'undefined' || typeof div.style.webkitPerspective !== 'undefined';
    }

    function testSVGSupport() {
        var div = create('div');
        div.innerHTML = '<svg/>';
        return (div.firstChild && div.firstChild.namespaceURI) == 'http://www.w3.org/2000/svg';
    }

    function preloadNext(index) {
        if(index - currentIndex >= options.preload)
            return;
        loadImage(index + 1, function() { preloadNext(index + 1); });
    }

    function preloadPrev(index) {
        if(currentIndex - index >= options.preload)
            return;
        loadImage(index - 1, function() { preloadPrev(index - 1); });
    }

    function bind(element, event, callback) {
        if(element.addEventListener)
            element.addEventListener(event, callback, false);
        else 
            element.attachEvent('on' + event, callback);
    }

    function unbind(element, event, callback) {
        if(element.removeEventListener)
            element.removeEventListener(event, callback, false);
        else 
            element.detachEvent('on' + event, callback);
    }

    function getByID(id) {
        return document.getElementById(id);
    }

    function create(element) {
        return document.createElement(element);
    }

    function destroyPlugin() {
        unbindEvents();
        unbindImageClickListeners();
        unbind(document, 'keydown', keyDownHandler);
        document.getElementsByTagName('body')[0].removeChild(document.getElementById('baguetteBox-overlay'));
        currentIndex = 0;
        currentGallery = -1;
        galleries.length = 0;
        imagesMap.length = 0;
    }

    return {
        run: run,
        destroy: destroyPlugin,
        showNext: showNextImage,
        showPrevious: showPreviousImage
    };

}));
