import React, { useEffect, useMemo, useState } from "react";
import Icon from "components/util/Icon";
import SelectButton from "components/util/SelectButton";
import { SessionDataset } from "../sessions/GenericSessionTable";
import DropdownStructure from "./components/DropdownStructure";
import { useQuery } from "react-query";
import { APIFetchV1 } from "util/api";
import { SpecificSessionReturns } from "types/api-returns";
import Loading from "components/util/Loading";
import DebugContent from "components/util/DebugContent";
import { CreateChartMap, CreateScoreMap, CreateSongMap } from "util/data";
import {
	Lamps,
	Grades,
	ScoreDocument,
	IDStrings,
	GetGamePTConfig,
	GamePTConfig,
	integer,
	SongDocument,
	ChartDocument,
	Game,
	FolderDocument,
	TableDocument,
	SessionScoreInfo,
} from "tachi-common";
import { PartialArrayRecordAssign } from "util/misc";
import MiniTable from "../components/MiniTable";
import { ChangeOpacity } from "util/color-opacity";
import TitleCell from "../cells/TitleCell";
import DifficultyCell from "../cells/DifficultyCell";
import Divider from "components/util/Divider";
import ScoreCell from "../cells/ScoreCell";
import deepmerge from "deepmerge";
import IIDXLampCell from "../cells/IIDXLampCell";

export default function GenericSessionDropdown({ data }: { data: SessionDataset[0] }) {
	const { isLoading, error, data: sessionData } = useQuery(
		`/sessions/${data.sessionID}`,
		async () => {
			const res = await APIFetchV1<SpecificSessionReturns>(`/sessions/${data.sessionID}`);

			if (!res.success) {
				throw new Error(res.description);
			}

			return res.body;
		}
	);

	const [view, setView] = useState<"raises" | "highlights" | "graphs" | "debug">("graphs");

	if (error) {
		return <>{(error as Error).message}</>;
	}

	if (isLoading || !sessionData) {
		return <Loading />;
	}

	let content;

	if (view === "raises") {
		content = <SessionRaiseBreakdown sessionData={sessionData} />;
	} else if (view === "debug") {
		content = <DebugContent data={sessionData} />;
	}

	return (
		<DropdownStructure
			buttons={
				<>
					<SelectButton setValue={setView} value={view} id="graphs">
						<Icon type="chart-area" />
						Graphs
					</SelectButton>
					<SelectButton setValue={setView} value={view} id="raises">
						<Icon type="receipt" />
						Raises
					</SelectButton>
					<SelectButton setValue={setView} value={view} id="highlights">
						<Icon type="star" />
						Highlights
					</SelectButton>

					<SelectButton setValue={setView} value={view} id="debug">
						<Icon type="bug" />
						Debug Info
					</SelectButton>
				</>
			}
		>
			{content}
		</DropdownStructure>
	);
}

function SessionRaiseBreakdown({ sessionData }: { sessionData: SpecificSessionReturns }) {
	const game = sessionData.session.game;
	const playtype = sessionData.session.playtype;

	const gptConfig = GetGamePTConfig(game, playtype);

	const [chartIDs, setChartIDs] = useState<string[] | null>([]);
	const [tableID, setTableID] = useState<string>("levels");
	const [tableFolders, setTableFolders] = useState<FolderDocument[]>([]);
	const [folder, setFolder] = useState<FolderDocument | null>(null);
	const [filter, setFilter] = useState<"folder" | "all" | "highlighted">("all");

	useEffect(() => {
		APIFetchV1(`/games/${game}/${playtype}/tables/${tableID}`).then(r => {
			if (!r.success) {
				throw new Error(r.description);
			}

			// @ts-expect-error todo
			setTableFolders(r.body.folders);
			// @ts-expect-error todo
			setFolder(r.body.folders[r.body.folders.length - 1]);
		});
	}, [tableID]);

	useEffect(() => {
		if (filter !== "folder" || !folder) {
			setChartIDs(null);
			return;
		}

		APIFetchV1(`/games/${game}/${playtype}/folders/${folder.folderID}`).then(r => {
			if (!r.success) {
				throw new Error(r.description);
			}

			// @ts-expect-error todo
			setChartIDs(r.body.charts.map(e => e.chartID));
		});
	}, [folder, tableID, filter]);

	const { isLoading, error, data } = useQuery(`/games/${game}/${playtype}/tables`, async () => {
		const res = await APIFetchV1<TableDocument[]>(`/games/${game}/${playtype}/tables`);

		if (!res.success) {
			throw new Error(res.description);
		}

		return res.body;
	});

	if (error) {
		return <>{(error as Error).message}</>;
	}

	if (isLoading || !data) {
		return <Loading />;
	}

	return (
		<>
			<div className="col-12">
				<div className="row">
					<div className="col-12">
						<div className="btn-group">
							<SelectButton value={filter} setValue={setFilter} id="folder">
								<Icon type="folder-open" />
								Folder Filter
							</SelectButton>
							<SelectButton value={filter} setValue={setFilter} id="all">
								<Icon type="plus" />
								No Filter
							</SelectButton>
							<SelectButton value={filter} setValue={setFilter} id="highlighted">
								<Icon type="star" />
								Highlights Only
							</SelectButton>
						</div>
					</div>
					{filter === "folder" && (
						<>
							<div className="col-12">
								<Divider className="mt-4 mb-4" />
							</div>
							<div className="col-6">
								<select
									className="form-control"
									value={tableID}
									onChange={e => setTableID(e.target.value)}
								>
									{data.map(e => (
										<option key={e.tableID} value={e.tableID}>
											{e.title}
										</option>
									))}
								</select>
							</div>
							<div className="col-6">
								<select
									className="form-control"
									value={folder?.folderID}
									onChange={e =>
										setFolder(
											tableFolders.find(f => f.folderID === e.target.value)!
										)
									}
								>
									{tableFolders.map(e => (
										<option key={e.folderID} value={e.folderID}>
											{e.title}
										</option>
									))}
								</select>
							</div>
						</>
					)}
				</div>

				<Divider className="mt-4 mb-4" />
			</div>
			<SessionScoreStatBreakdown {...{ sessionData, chartIDs, filter }} />
		</>
	);
}

function SessionScoreStatBreakdown({
	sessionData,
	chartIDs,
	filter,
}: {
	sessionData: SpecificSessionReturns;
	chartIDs: string[] | null;
	filter: "folder" | "all" | "highlighted";
}) {
	const songMap = CreateSongMap(sessionData.songs);
	const chartMap = CreateChartMap(sessionData.charts);
	const scoreMap = CreateScoreMap(sessionData.scores);

	const [newLamps, newGrades] = useMemo(() => {
		const newLamps: Partial<Record<
			Lamps[IDStrings],
			{ score: ScoreDocument; scoreInfo: SessionScoreInfo }[]
		>> = {};
		const newGrades: Partial<Record<
			Grades[IDStrings],
			{ score: ScoreDocument; scoreInfo: SessionScoreInfo }[]
		>> = {};

		for (const scoreInfo of sessionData.session.scoreInfo) {
			const score = scoreMap.get(scoreInfo.scoreID);

			if (!score) {
				console.error(
					`Session score info contains scoreID ${scoreInfo.scoreID}, but no score exists?`
				);
				continue;
			}

			if (filter === "folder" && chartIDs && !chartIDs.includes(score.chartID)) {
				continue;
			} else if (filter === "highlighted" && !score.highlight) {
				continue;
			}

			if (scoreInfo.isNewScore) {
				PartialArrayRecordAssign(newLamps, score.scoreData.lamp, { score, scoreInfo });
				PartialArrayRecordAssign(newGrades, score.scoreData.grade, { score, scoreInfo });
			} else {
				if (scoreInfo.lampDelta > 0) {
					PartialArrayRecordAssign(newLamps, score.scoreData.lamp, { score, scoreInfo });
				}

				if (scoreInfo.gradeDelta > 0) {
					PartialArrayRecordAssign(newGrades, score.scoreData.grade, {
						score,
						scoreInfo,
					});
				}
			}
		}
		return [newLamps, newGrades];
	}, [chartIDs, filter]);

	const gptConfig = GetGamePTConfig(sessionData.session.game, sessionData.session.playtype);

	const [view, setView] = useState<"lamps" | "both" | "grades">("both");

	return (
		<>
			<div className="col-12 d-none d-lg-block">
				<div className="btn-group">
					<SelectButton value={view} setValue={setView} id="lamps">
						<Icon type="lightbulb" />
						New Lamps
					</SelectButton>

					<SelectButton value={view} setValue={setView} id="both">
						<Icon type="bolt" />
						Both
					</SelectButton>
					<SelectButton value={view} setValue={setView} id="grades">
						<Icon type="sort-alpha-up" />
						New Grades
					</SelectButton>
				</div>
				<Divider className="mt-4 mb-4" />
			</div>
			{view === "both" ? (
				<>
					<div className="col-12 col-lg-6">
						<MiniTable
							headers={["Lamp", "New Lamps"]}
							colSpan={[1, 2]}
							className="table-sm"
						>
							<ElementStatTable
								chartMap={chartMap}
								songMap={songMap}
								counts={newLamps}
								game={sessionData.session.game}
								type="lamp"
								gptConfig={gptConfig}
							/>
						</MiniTable>
					</div>
					<div className="col-12 col-lg-6">
						<MiniTable
							headers={["Grade", "New Grades"]}
							colSpan={[1, 2]}
							className="table-sm"
						>
							<ElementStatTable
								chartMap={chartMap}
								songMap={songMap}
								counts={newGrades}
								game={sessionData.session.game}
								type="grade"
								gptConfig={gptConfig}
							/>
						</MiniTable>
					</div>
				</>
			) : view === "grades" ? (
				<div className="col-12">
					<MiniTable headers={["Grade", "New Grades"]} colSpan={[1, 100]}>
						<ElementStatTable
							fullSize
							chartMap={chartMap}
							songMap={songMap}
							counts={newGrades}
							game={sessionData.session.game}
							type="grade"
							gptConfig={gptConfig}
						/>
					</MiniTable>
				</div>
			) : (
				<div className="col-12">
					<MiniTable headers={["Grade", "New Lamps"]} colSpan={[1, 100]}>
						<ElementStatTable
							fullSize
							chartMap={chartMap}
							songMap={songMap}
							counts={newLamps}
							game={sessionData.session.game}
							type="lamp"
							gptConfig={gptConfig}
						/>
					</MiniTable>
				</div>
			)}
		</>
	);
}

function ElementStatTable({
	type,
	counts,
	gptConfig,
	songMap,
	chartMap,
	game,
	fullSize = false,
}: {
	type: "lamp" | "grade";
	counts: Record<string, { score: ScoreDocument; scoreInfo: SessionScoreInfo }[]>;
	gptConfig: GamePTConfig;
	songMap: Map<integer, SongDocument<Game>>;
	chartMap: Map<string, ChartDocument<IDStrings>>;
	game: Game;
	fullSize?: boolean;
}) {
	function BreakdownChartContents({
		score,
		scoreInfo,
	}: {
		score: ScoreDocument;
		scoreInfo: SessionScoreInfo;
	}) {
		const chart = chartMap.get(score.chartID)!;
		const song = songMap.get(score.songID)!;

		if (fullSize) {
			let preScoreCell = <td>No Play</td>;

			if (!scoreInfo.isNewScore) {
				const oldGradeIndex = score.scoreData.gradeIndex - scoreInfo.gradeDelta;
				const oldLampIndex = score.scoreData.lampIndex - scoreInfo.lampDelta;

				const mockScore = deepmerge(score, {
					scoreData: {
						score: score.scoreData.score - scoreInfo.scoreDelta,
						percent: score.scoreData.percent - scoreInfo.percentDelta,
						grade: gptConfig.grades[oldGradeIndex],
						gradeIndex: oldGradeIndex,
						lamp: gptConfig.lamps[oldLampIndex],
						lampIndex: oldLampIndex,
					},
				}) as ScoreDocument;

				if (type === "grade") {
					preScoreCell = <ScoreCell score={mockScore} />;
				} else {
					preScoreCell = (
						// @ts-expect-error temp
						<IIDXLampCell sc={mockScore} />
					);
				}
			}

			if (score) {
				return (
					<>
						<TitleCell chart={chart} game={game} song={song} />
						<DifficultyCell chart={chart} game={game} />
						{preScoreCell}
						<td>⟶</td>
						{type === "grade" ? (
							<ScoreCell {...{ score, game, playtype: score.playtype }} />
						) : (
							// @ts-expect-error temp
							<IIDXLampCell sc={score} game={game} playtype={score.playtype} />
						)}
					</>
				);
			}
		}

		return (
			<>
				<TitleCell noArtist chart={chart} game={game} song={song} />
				<DifficultyCell alwaysShort chart={chart} game={game} />
			</>
		);
	}

	// relements.. haha
	const relevantElements =
		type === "lamp"
			? gptConfig.lamps.slice(gptConfig.lamps.indexOf(gptConfig.clearLamp) - 1).reverse()
			: gptConfig.grades.slice(gptConfig.grades.indexOf(gptConfig.clearGrade) - 1).reverse();

	const tableContents = [];

	const colours = type === "lamp" ? gptConfig.lampColours : gptConfig.gradeColours;

	for (const element of relevantElements) {
		if (!counts[element] || !counts[element].length) {
			continue;
		}

		const firstData = counts[element][0];

		tableContents.push(
			<tr key={element}>
				<td
					style={{
						// @ts-expect-error this is a hack due to the funky type of colours and element.
						backgroundColor: ChangeOpacity(colours[element], 0.1),
					}}
					rowSpan={counts[element]!.length}
				>
					{element}
				</td>
				<BreakdownChartContents {...firstData} />
			</tr>
		);

		for (const data of counts[element]!.slice(1)) {
			tableContents.push(
				<tr key={data.score.scoreID}>
					<BreakdownChartContents {...data} />
				</tr>
			);
		}
	}

	if (tableContents.length === 0) {
		return (
			<tr>
				<td colSpan={3}>Nothing...</td>
			</tr>
		);
	}

	return <>{tableContents}</>;
}