const { desktopCapturer, remote } = require("electron");
const { Menu } = remote;

// Global state
let mediaRecorder; // MediaRecorder instance to capture footage
const recordedChunks = [];
var buffer = null;

// Buttons
const videoElement = document.querySelector("video");

function changeFavicon(src) {
  var oldLink = document.getElementById("appFavicon");
  if (oldLink) {
    document.head.removeChild(oldLink);
  }

  var link = document.createElement("link");
  link.id = "appFavicon";
  link.rel = "shortcut icon";
  link.href = src;
  document.head.appendChild(link);
}

const startBtn = document.getElementById("startBtn");
startBtn.onclick = (e) => {
  if (!mediaRecorder) {
    alert("Please select source first");
    return;
  }
  mediaRecorder.start();

  startBtn.classList.add("btn-danger");
  startBtn.innerText = "Recording";
};

const stopBtn = document.getElementById("stopBtn");
stopBtn.onclick = (e) => {
  if (!mediaRecorder) {
    alert("Please select source and start recording");
    return;
  }
  mediaRecorder.stop();
  startBtn.classList.remove("btn-danger");
  startBtn.innerText = "Start";
};

const videoSelectBtn = document.getElementById("videoSelectBtn");
videoSelectBtn.onclick = getVideoSources;

// Get the available video sources
async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ["window", "screen"],
  });
  // console.log(inputSources);
  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map((source) => {
      return {
        label: source.name,
        click: () => {
          recVideoDiv = document.getElementById("recorded-div");
          recVideoDiv.classList.remove("container");
          recVideoDiv.style.width = "0px";
          recVideoDiv.style.height = "0px";
          selectSource(source);
        },
      };
    })
  );

  videoOptionsMenu.popup();
}

// Change the videoSource window to record
async function selectSource(source) {
  videoSelectBtn.innerText = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: source.id,
        maxFrameRate: 5, // to set frame rate of video
        minWidth: 640,
        maxWidth: 1280,
        minHeight: 480,
        maxHeight: 720,
      },
    },
  };

  // Create a Stream with above constraints
  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  // Capture mic audio stream only
  let audio = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false,
  });

  //Combine Stream
  let combine_stream = new MediaStream([
    ...stream.getTracks(),
    ...audio.getTracks(),
  ]);

  // Preview the source in a video element
  videoElement.srcObject = stream;
  videoElement.play();

  // Create the Media Recorder
  const options = {
    mimeType: "video/webm; codecs=vp8,opus",
    videoBitsPerSecond: 1000000,
    audioBitsPerSecond: 128000,
  };
  mediaRecorder = new MediaRecorder(combine_stream, options);

  // Register Event Handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;

  // Updates the UI
}

// Captures all recorded chunks
function handleDataAvailable(e) {
  console.log("video data available");
  recordedChunks.push(e.data);
}

// Saves the video file on stop
async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: "video/webm; codecs=vp9",
  });

  recVideoDiv = document.getElementById("recorded-div");
  recVideoDiv.classList.add("container");
  recVideoDiv.style.width = "100%";
  recVideoDiv.style.height = "auto";
  newVideo = recVideoDiv.getElementsByTagName("video")[0];
  // console.log(newVideo);
  newVideo.controls = "controls";
  newVideo.src = URL.createObjectURL(blob);
  newVideo.load();

  recordedChunks.splice(0, recordedChunks.length);
}
