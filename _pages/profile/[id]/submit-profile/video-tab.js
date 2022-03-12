import React from "react";
import ReactWebcam from "react-webcam";
import {  Steps, Row, Col, Button, Upload } from 'antd';
import {FileAddFilled} from '@ant-design/icons';
import { get } from "relay-runtime/lib/handlers/connection/ConnectionInterface";




const VIDEO_OPTIONS = {
    types: {
        value: [
            "video/mp4",
            "video/webm",
            "video/quicktime",
            "video/x-msvideo",
            "video/x-matroska"
        ],
        label: ".mp4, .webm, .avi, .mov, .mkv"
    },
    size: {
        value: 15 * 1024 * 1024,
        label: "15 MB"
    },
    dimensions: {
        minWidth: 352,
        minHeight: 352
    }
};

export default class VideoTab extends React.Component {
    constructor(props) {
        super(props);
        this.camera = React.createRef();
        this.mediaRecorderRef = React.createRef();

        console.log('ImageTab props=', props);

        this.state = {
            cameraEnabled: false,
            recording: false,
            recordedVideo: [],
            recordedVideoUrl: '',
            videoURI: ''
        }
        
    }
  
    videoConstraints = {
      width: { min: 640, ideal: 1920 }, //     width: { min: 640, ideal: 1280, max: 1920 },
      height: { min: 480, ideal: 1080 } //     height: { min: 480, ideal: 720, max: 1080 }
    }
    
    uploadToIPFS = async () => {
      let file = this.state.file;
      console.log(file)
      let buffer = Buffer.from(await file.arrayBuffer());
      console.log(buffer)
        let URI = await fetch(process.env.NEXT_PUBLIC_MEDIA_SERVER + '/video', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(
                {buffer: buffer, type: 'webm'}
            )
  
        }).then(function (URI) {
            console.log(URI)
            return URI.URI
        })
        this.setState({fileURI:URI})
    }
     draggerProps = {
      name: 'file',
      multiple: false,
      accept:VIDEO_OPTIONS.types.label,
      onChange:(file)=>{
        console.log(file)
        let blob = new Blob([file.file.originFileObj],{type: file.type});
        let videoURL = window.URL.createObjectURL(blob);
        console.log(videoURL)
        this.setState({file:file.file.originFileObj,recordedVideoUrl:videoURL})
      },
      onDrop(e) {
        console.log('Dropped files', e.dataTransfer.files);
      },
    };
  

  enableCamera = () => {
    this.setState({ cameraEnabled: true });
  }

  retakeVideo = () => {
    this.setState({
      recording: false,
      cameraEnabled: true,
      recordedVideo: []
    })
  };
  
  onUserMedia = (mediaStream) => {
    console.log('User media detected', mediaStream);
  }

  onUserMediaError = (error) => {
    console.error('User media error', error);
  }

  handleStartCaptureClick = () => {
    this.setState({ recording: true });

    this.mediaRecorderRef.current = new MediaRecorder(this.camera.current.stream, {
      mimeType: 'video/webm;codecs=h264,avc1'
    });

    this.mediaRecorderRef.current.ondataavailable = this.handleDataAvailable;
    this.mediaRecorderRef.current.onstop = this.handleStop;

    this.mediaRecorderRef.current.start();
  }

  handleDataAvailable = ({ data }) => {
    console.log('data available=', data);
    this.setState({
      recordedVideo: this.state.recordedVideo.concat(data)
    });
  }

  handleStopCaptureClick = () => {
    if (this.state.recording) {
      this.mediaRecorderRef.current.stop();
    }
  };


  
  handleStop = async () => {
      console.log(this.state.recordedVideo);

      let blob = new Blob(this.state.recordedVideo, {type: 'video/webm;codecs=h264,avc1'});
      let videoURL = window.URL.createObjectURL(blob);
      
      //let buffer = await this.blobToArray(blob);
      //this.uploadToIPFS(buffer);
      this.setState({recordedVideoUrl: videoURL, file:blob, recording: false, cameraEnabled: false});
  }

  render = () => {
    return (
      <React.Fragment>
      <Row>
        <Col> 
        {!this.state.cameraEnabled && !this.state.file &&(
          <Button type="primary" onClick={this.enableCamera}>Record now using my camera</Button>
        )}
        

        {this.state.cameraEnabled ? (
          <div>
            <ReactWebcam
              style={{ width: "100%" }}
              ref={this.camera}
              audio={true}
              mirrored={false}
              forceScreenshotSourceSize
              videoConstraints={this.videoConstraints}
              onCanPlayThrough={() => false}
              onClick={(event) => event.preventDefault()}
              onUserMedia={this.onUserMedia} 
              onUserMediaError={this.onUserMediaError}
            />
            { this.state.recording ? (
              <div>
                <div>RECORDING IN PROGRESS</div>
                <button onClick={this.handleStopCaptureClick}>Stop recording!</button>
              </div>
            ) : <button onClick={this.handleStartCaptureClick}>Start capturing video!</button> }
            
          </div>
        ) : (
          !this.state.recording && this.state.recordedVideoUrl !== '' ? (
            <div>
              <video controls style={{ width: "100%" }} src={this.state.recordedVideoUrl}></video>
              <button onClick={this.retakeVideo}>Retake video</button>
            </div>
          ) : (
            null
          )
        )}
        {/* { this.state.picture ? (
          <div>
            This is your picture:
            <img src={this.state.picture}></img>
            <button onClick={this.retakeVideo}>Retake image</button>
          </div>
        ) : null } */}
        </Col>
        {!this.state.cameraEnabled && !this.state.file &&(
          <Col>
        <Upload.Dragger {...this.draggerProps}>
    
        <FileAddFilled />
    
    <p className="ant-upload-text">Click or drag file to this area to upload</p>
    <p className="ant-upload-hint">
      Video's format can be: {VIDEO_OPTIONS.types.label}
    </p>
  </Upload.Dragger>
        </Col>
        )}
        
      </Row>
      <Row>
        {this.state.file ? <Button onClick={this.uploadToIPFS}>Upload!</Button> : null}
      </Row>
      </React.Fragment>
    );
  }
}
