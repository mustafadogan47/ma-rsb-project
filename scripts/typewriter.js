// Glowing Pulse Animation
document.addEventListener('DOMContentLoaded', function() {
    console.log('Animation script loaded');
    
    const textContainer = document.querySelector('.typed-text');
    
    if (!textContainer) {
        console.error('typed-text element not found!');
        return;
    }
    
    // Just add glow class - text is already in HTML
    textContainer.classList.add('glow-text');
    console.log('Glow animation activated');
});
