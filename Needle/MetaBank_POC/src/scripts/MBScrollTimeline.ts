import { Behaviour, PlayableDirector, serializeable } from "@needle-tools/engine";
import { WaitForSeconds, Mathf } from "@needle-tools/engine";


export class ScollTimeline extends Behaviour{
    @serializeable(PlayableDirector)
    timeline!: PlayableDirector;

    @serializeable()
    startOffset!: number;

    @serializeable()
    lerpSpeed: number = 2.5;

    @serializeable()
    startLerpSpeed: number = 0.5;

    private updateTimelineCoroutine!: Generator<unknown>;

    start(): void {
        const maincam = this.context.mainCameraComponent;
        if(!maincam) return;

        const startFOV = maincam.fieldOfView;   // Default 16:9

        const resizeObserver = new ResizeObserver(_ => {
            let fov = startFOV || 0;
            const aspect = Mathf.clamp(this.context.domWidth / this.context.domHeight / 1.77777777, 0.25, 3.5);
            fov /= Mathf.lerp(aspect, 1, 0.2);
            maincam.fieldOfView = fov;
        });

        resizeObserver.observe(this.context.domElement)

        this.timeline.time = 0;
    }

    onEnable(): void {
        this.updateTimelineCoroutine = this.updateTimeline();
        this.startCoroutine(this.updateTimelineCoroutine);
    }

    onDisable(): void {
        this.stopCoroutine(this.updateTimelineCoroutine);
    }

    *updateTimeline(){
        yield WaitForSeconds(1);

        if (!this.timeline) return;
        this.timeline.play();

        while(this.timeline.time < this.startOffset){
            yield;
        }

        while(this.enabled){
            if(this.timeline){
                if(this.timeline.isPlaying) this.timeline.pause();

                const length = this.timeline.duration - this.startOffset;
                const progress = window.scrollY / (document.body.scrollHeight - window.innerHeight);

                this.timeline.time = Mathf.lerp(this.timeline.time, progress*length + this.startOffset, this.context.time.deltaTime * this.lerpSpeed);
                this.timeline.evaluate();
            }
            yield;
        }
    }
}