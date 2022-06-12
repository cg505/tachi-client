import { Game } from "tachi-common";
import { Playtype } from "types/tachi";
import { BMSGraphsComponent } from "./components/BMSScoreDropdownParts";
import { IIDXGraphsComponent } from "./components/IIDXScoreDropdownParts";
import { ITGGraphsComponent } from "./components/ITGScoreDropdownParts";

export function GPTDropdownSettings(game: Game, playtype: Playtype): any {
	if (game === "iidx") {
		return {
			renderScoreInfo: true,
			// let the record show that i tried fixing this
			// for a while, but gave up.
			GraphComponent: IIDXGraphsComponent as any,
		};
	} else if (game === "bms") {
		return {
			renderScoreInfo: true,
			GraphComponent: BMSGraphsComponent as any,
		};
	} else if (game === "itg") {
		return {
			renderScoreInfo: true,
			GraphComponent: ITGGraphsComponent as any,
		};
	}

	return {};
}
