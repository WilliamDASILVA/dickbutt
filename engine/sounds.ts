/*	--------------------------------------------------- *\
		Sounds
\*	--------------------------------------------------- */
module Sounds{

	var elementsToDownload = [];
	var soundEnabled = true;
	var soundList = [];

	/*	--------------------------------------------------- *\
			[function] setEnabled(value)
	
			* Set si le son doit être activé ou non *
	
			Return: nil
	\*	--------------------------------------------------- */
	export function setEnabled(value : boolean){
		soundEnabled = value;
	}

	/*	--------------------------------------------------- *\
			[function] getPlayingSounds(value)
	
			* Get the current playing sounds *
	
			Return: playingSounds
	\*	--------------------------------------------------- */
	export function getPlayingSounds(){
		var playingSounds = [];
		for (var i = 0; i < soundList.length; ++i) {
			if(soundList[i].playing){
				playingSounds.push(soundList[i]);
			}
		}

		return playingSounds;
	}

	/*	--------------------------------------------------- *\
			[class] Sound()
	
			* Crée un son *
	
	\*	--------------------------------------------------- */
	export class Sound extends Events{
		
		element: any;
		path: string;
		duration: number;
		currentTime: number;
		volume: number;
		muted: boolean;
		muteTemp: number;
		request: any;
		source: any;
		isReady: boolean;
		playing: boolean;

		/*	--------------------------------------------------- *\
				[function] constructor()
		
				* Crée un son *
		
				Return: nil
		\*	--------------------------------------------------- */
		constructor(path : string){
			super();

			this.element = null;
			this.isReady = false;
			this.playing = false;

			if(Global.isAndroid()){
				if(typeof window['Media'] != "undefined"){
					this.element = new window['Media']("/android_asset/www/" + path, function(){
						this.emit("end");
					}, function(error){
						console.log("Error", error);
					});
					setTimeout(function(){
						this.isReady = true;
						this.emit("ready");
					}, 100);
				}
			}
			else{
				if(typeof Audio != "undefined"){
					this.element = new Audio(path);
					this.element.addEventListener("canplaythrough", () => {
						this.isReady = true;
						this.emit("ready");
					});

					this.element.addEventListener("ended", () => {
						this.emit("end");
					});
				}
			}

			this.path = path;

			this.duration = 0;
			this.volume = 1;
			if(this.element){
				this.duration = this.element['duration'];
				this.volume = this.element['volume'];
			}
			this.currentTime = 0;
			this.muted = false;
			this.muteTemp = 1;

			soundList.push(this);
		}

		/*	--------------------------------------------------- *\
				[function] getPath()
		
				* Retourne le path du sound *
		
				Return: path
		\*	--------------------------------------------------- */
		getPath(){
			return this.path;
		}

		/*	--------------------------------------------------- *\
				[function] setPath(path)
		
				* Set le path du sound *
		
				Return: nil
		\*	--------------------------------------------------- */
		setPath(path : string){
			this.path = path;
			this.element.src = path;
		}

		/*	--------------------------------------------------- *\
				[function] getDUration()
		
				* Retourne la longeur de la bande don *
		
				Return: duration
		\*	--------------------------------------------------- */
		getDuration(){
			return this.duration;
		}

		/*	--------------------------------------------------- *\
				[function] getVolume()
		
				* Retourne le volume du son *
		
				Return: volume
		\*	--------------------------------------------------- */
		getVolume(){
			return this.volume;
		}

		/*	--------------------------------------------------- *\
				[function] setVolume(volume)
		
				* Set le volume du son *
		
				Return: nil
		\*	--------------------------------------------------- */
		setVolume(volume : number){
			if(volume >= 0){
				this.volume = volume;
				if(typeof window['Media'] != "undefined"){
					this.element.setVolume(volume);
				}
				else{
					this.element.volume = volume;
				}

				this.emit("volumechange");
			}
		}

		/*	--------------------------------------------------- *\
				[function] setCurrentTime(time)
		
				* Set le currentTime du son en secondes *
		
				Return: nil
		\*	--------------------------------------------------- */
		setCurrentTime(time : number){
			this.currentTime = time;
			if (typeof window['Media'] != "undefined") {
				this.element.seekTo(time);
			}
			else{
				this.element.currentTime = time;
			}
		}

		/*	--------------------------------------------------- *\
				[function] getCurrentTime()
		
				* Retourne le temps actuel en secondes *
		
				Return: currentTime
		\*	--------------------------------------------------- */
		getCurrentTime(){
			return this.currentTime;
		}

		/*	--------------------------------------------------- *\
				[function] isMute()
		
				* Retourne si le son est mute ou pas *
		
				Return: true, false
		\*	--------------------------------------------------- */
		isMute(){
			return this.muted;
		}

		/*	--------------------------------------------------- *\
				[function] play()
		
				* Joue le son *
		
				Return: nil
		\*	--------------------------------------------------- */
		play(){
			if(this.element){
				if(soundEnabled){
					this.element.play();
					this.playing = true;	
				}
				this.emit("play");
			}
		}

		/*	--------------------------------------------------- *\
				[function] pause()
		
				* Pause le son *
		
				Return: nil
		\*	--------------------------------------------------- */
		pause(){
			this.element.pause();
			this.playing = false;
			this.emit("pause");
		}

		/*	--------------------------------------------------- *\
				[function] stop()
		
				* Stoppe le son et le restart *
		
				Return: nil
		\*	--------------------------------------------------- */
		stop(){
			this.pause();
			this.setCurrentTime(0);
			if(Global.isAndroid()){
				this.element.stop();				
			}
			this.playing = true;
			this.emit("stop");
		}

		/*	--------------------------------------------------- *\
				[function] mute()
		
				* Mute le son *
		
				Return: nil
		\*	--------------------------------------------------- */
		mute(){
			this.muteTemp = this.getVolume();
			this.setVolume(0);
			this.muted = true;
			this.emit("mute");
		}

		/*	--------------------------------------------------- *\
				[function] isPlaying()
		
				* Check si le son est entrant d'être joué ou non *
		
				Return: true, false
		\*	--------------------------------------------------- */
		isPlaying():boolean{
			return this.playing;
		}

		/*	--------------------------------------------------- *\
				[function] unmute()
		
				* Demute le son *
		
				Return: nil
		\*	--------------------------------------------------- */
		unmute(){
			if(this.muteTemp){
				this.setVolume(this.muteTemp);
			}
			this.muted = false;
			this.emit("unmute");
		}

	}
}