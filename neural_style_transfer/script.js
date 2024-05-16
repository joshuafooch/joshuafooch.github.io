// initialize picture variables
let displayedContentImage;
let displayedStyleImage;
let trueContentImage;
let trueStyleImage;
let generatedImage;
let contentMaxPixels;
let styleMaxPixels;
let learningRate;
if (window.innerWidth > 600) {
  contentMaxPixels = 500000;
  styleMaxPixels = 400000;
  learningRate = 0.5;
} else { // limit the image resolution for processing for mobile devices with a browser memory limit
  contentMaxPixels = 20000;
  styleMaxPixels = 20000;
  learningRate = 0.005;
}

// instantiate buttons, dropdowns and slider
$("#defaultContentPictures").on("change", (event) => {
  if (document.getElementById("contentimage").childNodes[0]) document.getElementById("contentimage").removeChild(document.getElementById("contentimage").childNodes[0]);
  if (event.target.value == "nil") return;
  let defaultPaths = {
    "dog": "content_images/dog.jpg",
    "cat": "content_images/cat.jpg",
    "human": "content_images/human.jpg"
  };
  displayedContentImage = loadDefaultImage(defaultPaths[event.target.value], "content");
  displayedContentImage.classList.add("contentimage");
  document.getElementById("contentimage").appendChild(displayedContentImage);
});

$("#defaultStylePictures").on("change", (event) => {
  if (document.getElementById("styleimage").childNodes[0]) document.getElementById("styleimage").removeChild(document.getElementById("styleimage").childNodes[0]);
  if (event.target.value == "nil") return;
  let defaultPaths = {
    "starry_night": "style_images/starry_night.jpg",
    "mona_lisa": "style_images/mona_lisa.jpg",
    "improvisation": "style_images/improvisation_31.jpg",
    "cafe": "style_images/a_man_in_a_cafe.jpg"
  };
  displayedStyleImage = loadDefaultImage(defaultPaths[event.target.value], "style");
  displayedStyleImage.classList.add("styleimage");
  document.getElementById("styleimage").appendChild(displayedStyleImage);
});

$("#getContentPicButton").on("click", () => {
  $("#getContentPic").click();
});

$("#getContentPic").on("change", (event) => {
  if (!event.target.files[0]) return;
  if (document.getElementById("contentimage").childNodes[0]) document.getElementById("contentimage").removeChild(document.getElementById("contentimage").childNodes[0]);
  displayedContentImage = loadBrowserImage(event.target.files[0], "content");
  displayedContentImage.classList.add("contentimage");
  document.getElementById("contentimage").appendChild(displayedContentImage);
});

$("#getStylePicButton").on("click", () => {
  $("#getStylePic").click();
});

$("#getStylePic").on("change", (event) => {
  if (!event.target.files[0]) return;
  if (document.getElementById("styleimage").childNodes[0]) document.getElementById("styleimage").removeChild(document.getElementById("styleimage").childNodes[0]);
  displayedStyleImage = loadBrowserImage(event.target.files[0], "style");
  displayedStyleImage.classList.add("styleimage");
  document.getElementById("styleimage").appendChild(displayedStyleImage);
});

$("#transferbutton").on("click", async () => {
  await $("#transferbutton").text("Transferring...");
  generatedImage = tf.tidy(() => {
    return transferStyleTraining(trueContentImage, trueStyleImage, generatedImage, 1e-4, 8e-4, model, Number($("#epochslider").val()), learningRate);
  });
});

$("#epochslider").on("input", () => {
  $(".epochtext").text("Epochs: " + $("#epochslider").val());
})

// function for loading displayed images and true sized images for processing from user selected file
function loadBrowserImage(file, contentOrStyle) {
  // Check that FileReader is supported and that a file is passed into the function
  if (FileReader && file) {
    let displayedImage = document.createElement("img");
    const fr = new FileReader();
    fr.addEventListener(
      "load", () => {
        displayedImage.src = fr.result;
        if (contentOrStyle == "content") {
          if(trueContentImage) trueContentImage.dispose(); // dispose old image tensor
          trueContentImage = document.createElement("img");
          trueContentImage.onload = async () => {
            trueContentImage = await loadImage(trueContentImage);

            // Check resolution of image to ensure it is not too large, else resize
            trueContentImage = resizeImage(trueContentImage, contentMaxPixels);

            // Generated image is a variable copy of truecontentimage
            if(generatedImage) generatedImage.dispose(); // dispose old image tensor
            generatedImage = tf.variable(trueContentImage);
          };
          trueContentImage.src = fr.result;
        } else if (contentOrStyle == "style") {
          trueStyleImage = document.createElement("img");
          trueStyleImage.onload = async () => {
            trueStyleImage = await loadImage(trueStyleImage);

            // Check resolution of image to ensure it is not too large, else resize
            trueStyleImage = resizeImage(trueStyleImage, styleMaxPixels);
          };
          trueStyleImage.src = fr.result;
        }
      },
      false,
    );
    fr.readAsDataURL(file);
    epochNum = 1; // reset epoch counter
    resetCanvas();
    return displayedImage;
  }
}

// function for loading displayed images and true sized images for processing from default selection of images
function loadDefaultImage(path, contentOrStyle) {
  let displayedImage = document.createElement("img");
  displayedImage.src = path;
  if (contentOrStyle == "content") {
    trueContentImage = document.createElement("img");
    trueContentImage.onload = async () => {
      trueContentImage = await loadImage(trueContentImage);

      // Check resolution of image to ensure it is not too large, else resize
      trueContentImage = resizeImage(trueContentImage, contentMaxPixels);

      // Generated image is a variable copy of truecontentimage
      if(generatedImage) generatedImage.dispose(); // dispose old image tensor
      generatedImage = tf.variable(trueContentImage);
    };
    trueContentImage.src = path;
  } else if (contentOrStyle == "style") {
    trueStyleImage = document.createElement("img");
    trueStyleImage.onload = async () => {
      trueStyleImage = await loadImage(trueStyleImage);

      // Check resolution of image to ensure it is not too large, else resize
      trueStyleImage = resizeImage(trueStyleImage, styleMaxPixels);
    };
    trueStyleImage.src = path;
  }
  epochNum = 1; // reset epoch counter
  resetCanvas();
  return displayedImage;
}

// function to resize the images so as to reduce memory usage
function resizeImage(image, maxPixels) {
  if (image.shape[0] * image.shape[1] > maxPixels) {
    let heightToWidthRatio = image.shape[0] / image.shape[1];
    let newHeight = Math.round(Math.sqrt(maxPixels * heightToWidthRatio));
    let newWidth = Math.round(newHeight / heightToWidthRatio);
    image = tf.image.resizeBilinear(image, [newHeight, newWidth]);
  }
  return image;
}

// function to reset canvas
function resetCanvas() {
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  canvas.style.width = "auto"; // reset canvas width
  canvas.style.height = "auto"; // reset canvas height
}

// get canvas height and width
const canvasContainer = document.getElementById("styledimagecontainer");
const canvas = document.getElementById("styledimagecanvas");
const canvasHeight = canvasContainer.offsetHeight;
const canvasWidth = canvasContainer.offsetWidth;

// instantiate model and epoch counter
const model = await tf.loadLayersModel("web_model/model.json"); // pre-trained VGG19 feature extractor
const NUM_CONTENT_LAYERS = 1;
const NUM_STYLE_LAYERS = 6;
let epochNum = 1; // current epoch counter
// model.summary();

// utility functions
function loadImage(imageObject){
  const image = tf.browser.fromPixels(imageObject);
  return image;
}

function preprocessInput(imageTensor){ // adapted from keras.applications.imagenet_utils documentation
  const reversedImageTensor = imageTensor.reverse(-1); // RGB -> BGR
  const means = tf.tensor([[[103.939, 116.779, 123.68]]]);
  const centeredImageTensor = reversedImageTensor.sub(means); // zero-center the image based on imagenet dataset means
  return centeredImageTensor;
}

function preprocessImage(imageTensor){
  const castImageTensor = tf.cast(imageTensor, "float32");
  const preprocessedImageTensor = preprocessInput(castImageTensor);
  return preprocessedImageTensor.expandDims();
}


// helper functions
function getContentTargets(image, model){
  image = preprocessImage(image);
  const outputs = model.predict(image);
  const contentTargets = outputs.slice(0, NUM_CONTENT_LAYERS);
  return contentTargets;
}

function getStyleTargets(image, model){
    image = preprocessImage(image);
    const outputs = model.predict(image);
    const styleTargets = outputs.slice(NUM_CONTENT_LAYERS, outputs.length);
    return styleTargets;
}

function getContentLoss(generatedImage, contentTargets, model){
    const contentFeatures = getContentTargets(generatedImage, model);
    var loss = tf.tensor([0]);
    for (var i = 0; i<contentTargets.length; i++){
      var loss_i = tf.mul(0.5, tf.sum(tf.square(tf.sub(contentFeatures[i], contentTargets[i]))));
      loss = tf.add(loss, loss_i);
    }
    return loss;
}

function getStyleLoss(generatedImage, styleTargets, model){
  const styleFeatures = getStyleTargets(generatedImage, model);
  const styleFeatureGrams = styleFeatures.map(gramMatrix);
  const styleTargetGrams = styleTargets.map(gramMatrix);
  var loss = tf.tensor([0]);
  for (var i = 0; i<styleTargets.length; i++){
    var loss_i = tf.mean(tf.square(tf.sub(styleFeatureGrams[i], styleTargetGrams[i])));
    loss = tf.add(loss, loss_i);
  }
  return loss;
}

function gramMatrix(inputTensor){
  const inputShape = inputTensor.shape;
  const t_Nchw = inputTensor.transpose([0, 3, 1, 2]);
  const t_Ncl = t_Nchw.reshape([inputShape[0], inputShape[3], -1]);
  const t_Nlc = t_Ncl.transpose([0, 2, 1]);
  const result = tf.matMul(t_Ncl, t_Nlc);

  const numLocations = tf.cast(inputShape[1] * inputShape[2], "float32");
  return result.div(numLocations);
}

function getTotalLoss(generatedImage, contentTargets, styleTargets, contentWeight, styleWeight, model){
  const contentLoss = getContentLoss(generatedImage, contentTargets, model);
  const styleLoss = getStyleLoss(generatedImage, styleTargets, model);
  const loss = tf.add(tf.mul(contentLoss, contentWeight), tf.mul(styleLoss, styleWeight));
  return loss;
}

function transferStyleTraining(trueContentImage, trueStyleImage, generatedImage, contentWeight, styleWeight, model, epochs, learningRate){
  const contentTargets = getContentTargets(trueContentImage, model);
  const styleTargets = getStyleTargets(trueStyleImage, model);
  let newGeneratedImage = generatedImage;
  for (let index = 0; index < epochs; index++) {
    const totalLoss = (newGeneratedImage) => getTotalLoss(newGeneratedImage, contentTargets, styleTargets, contentWeight, styleWeight, model);
    const valueAndGrad = tf.valueAndGrad(totalLoss);
    const {value, grad} = valueAndGrad(newGeneratedImage);
    const decayedLearningRate = learningRate * 0.5 ** ((index+epochNum)/10);
    newGeneratedImage = tf.sub(newGeneratedImage, tf.mul(decayedLearningRate, grad));
    console.log("Epoch: " + String(index + epochNum) + " Loss: " + String(value.dataSync([0])));
  }
  epochNum += epochs;
  $("#transferbutton").text("Transfer");
  newGeneratedImage = tf.clipByValue(newGeneratedImage, 0, 255);
  newGeneratedImage = tf.cast(newGeneratedImage, "int32");
  const generatedImageHeight = newGeneratedImage.shape[0];
  const generatedImageWidth = newGeneratedImage.shape[1];
  if ((canvasHeight/canvasWidth) > (generatedImageHeight/generatedImageWidth)){
    if (window.innerWidth > 600) canvas.style.width = "50vw";
    else canvas.style.width = "80vw";
  } else {
    if (window.innerWidth > 600) canvas.style.height = "60vh";
    else canvas.style.height = "40vh";
  }
  tf.browser.toPixels(newGeneratedImage, canvas);
  return newGeneratedImage;
}