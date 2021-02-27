import type { taskTypes } from "../../plugins";
const task: taskTypes = cy.task;

describe("AMP", () => {
  before(() => {
    task("loadDatabase", {
      path: "./wp-data/amp/data.sql",
    });
  });

  // after(() => {
  //   task("resetDatabase");
  //   task("removeAllPlugins");
  // });

  it("amp-img", () => {
    const url = "http://localhost:3001/amp-img/?frontity_name=amp-wordpress";

    cy.validateAMP(url);
    cy.visit(url);
    cy.get("amp-img > img").should("exist");
  });

  it("amp-audio", () => {
    const url = "http://localhost:3001/amp-audio/?frontity_name=amp-wordpress";

    cy.validateAMP(url);
    cy.visit(url);
    cy.get("amp-audio > audio").should((els) => {
      const audio = els[0] as HTMLAudioElement;
      audio.play();

      // You can play the audio element
      expect(audio.duration > 0 && !audio.paused && !audio.muted).to.eq(true);

      audio.pause();
    });
  });

  it("amp-video", () => {
    const url = "http://localhost:3001/amp-video/?frontity_name=amp-wordpress";

    cy.validateAMP(url);
    cy.visit(url);
    cy.get("amp-video > video").should((els) => {
      const video = els[0] as HTMLVideoElement;
      video.play();

      // You can play the video element
      expect(video.duration > 0 && !video.paused && !video.muted).to.eq(true);

      video.pause();
    });
  });
});
