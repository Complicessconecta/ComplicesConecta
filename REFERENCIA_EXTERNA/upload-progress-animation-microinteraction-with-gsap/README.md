# Upload Progress Animation Microinteraction with GSAP

A Pen created on CodePen.

Original URL: [https://codepen.io/takaneichinose/pen/jOWXBBd](https://codepen.io/takaneichinose/pen/jOWXBBd).

This is just my sample animation of file uploading progress animation, created with Vanilla (plain and simple) Javascript, and TweenLite (GSAP).

On the first click, the shape of the button will become circle. Then, the button will become a progress bar, and a "speech bubble" above the progress bar will be shown. That "speech bubble" shows the percentage of the upload progress. The "speech bubble" will tilt when the progress starts.

After the uploading is done, the button will turn into green colored circle, then the check mark will appear, pertaining that the upload is already done.

After 5 seconds, the button will return into its normal state.

I used GSAP's Timeline to do all of the steps of animation. Actually, creating the steps of animation became easier when it's used.

I didn't use any preprocessors in this pen, to show the simplicity of using GSAP in animation. No CSS loop hack, or whatsoever.