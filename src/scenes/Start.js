export default class Start extends Phaser.Scene {
    constructor() {
        super('Start');
    }
    preload() {
    }
    create() {
        this.phonePortrait = window.innerHeight > window.innerWidth;
        this.cameras.main.setZoom(this.scale.gameSize.width / (this.phonePortrait ? 720 : 1280));
        this.cameras.main.centerOn(this.phonePortrait ? 360 : 640, this.phonePortrait ? 640 : 360);
        const addText = this.add.text.bind(this.add);
        this.add.text = (...args) => addText(...args).setResolution(2);
        this.cameras.main.setBackgroundColor('#ffffff');
        const urlParams = new URLSearchParams(window.location.search);
        this.qualtricsParentOrigin = this.normalizeParentOrigin(urlParams.get('parentOrigin') || '');
        const gameId = urlParams.get('gameId');
        const qualtricsId = urlParams.get('qualtricsId') || urlParams.get('responseId') || urlParams.get('ResponseID') || urlParams.get('participantId');
        const respondentDecileRaw = Number.parseInt(urlParams.get('respondentDecile') || urlParams.get('respondentDecileValue') || '', 10);
        const respondentDecile = respondentDecileRaw >= 1 && respondentDecileRaw <= 10 ? respondentDecileRaw : null;
        console.log('gameId:', gameId);
        console.log('qualtricsId:', qualtricsId);
        console.log('respondentDecile:', respondentDecile);
        this.gameData = {
            gameId: gameId,
            qualtricsId: qualtricsId,
            condition: 'sufficiency',
            gameVersion: 'sufficiency_english_gini_8_piece_v20',
            gameStartTime: new Date().toISOString(),
            gameEndTime: null,
            totalDurationMs: null,
            userAgent: navigator.userAgent,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            isMobile: this.isMobileDevice(),
            screenOrientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
            survivalCheck: null,
            thresholdCheckChoice: null,
            thresholdCheckPassed: null,
            perCapitaEstimate: null,
            equalDivisionOutcomeChoice: null,
            equalDivisionOutcomePassed: null,
            totalFoodCountIndividualMoves: 0,
            totalFoodCountPersonDumps: 0,
            equalDivisionIndividualMoves: 0,
            equalDivisionShortcutUsed: false,
            partialRedistributionIndividualMoves: 0,
            partialRedistributionShortcutUsed: false,
            partialRedistributionFinal: {
                personC: 0,
                personB: 0,
                personA: 0
            },
            partialRedistributionSurvivors: null,
            redistributionRulesSelected: {
                noRedistribution: false,
                equalRedistribution: false,
                partialRedistribution: false
            },
            survivalRedistributionSelected: {
                noRedistribution: false,
                equalRedistribution: false,
                partialRedistribution: false
            },
            personalRedistributionSelected: {
                noRedistribution: false,
                equalRedistribution: false,
                partialRedistribution: false
            },
            freeAllocationFinal: null,
            freeAllocationGini: null,
            freeAllocationSurvivors: null,
            freeAllocationTotalMoved: null,
            freeAllocationDurationMs: null,
            redistributionFeasibility: null,
            manipulationCheckChoice: null,
            manipulationCheckPassed: null,
            equalGroupInterestChoice: null,
            partialGroupInterestChoice: null,
            groupDistributionPreference: null,
            partialRedistributionPreference: null,
            distributivePrinciplePriority: null, // Retired duplicate item; retained for export compatibility.
            socialContractGuarantee: null,
            personalVsGroupResponsibility: null,
            fairRuleChoice: null,
            foodRankReminder: null,
            foodPriorityChoice: null,
            workBreakChoice: null,
            floodPreparationChoice: null,
            personDShareChoice: null,
            personDEmpathyChoice: null,
            cooperationCompetitionChoice: null,
            respondentDecile: respondentDecile,
            respondentRole: null,
            selfInterestRoleAssignmentSource: 'random',
            respondentRoleRevealed: false,
            selfInterestCondition: null,
            selfInterestConditionIssue: null,
            selfInterestAllocationFinal: {
                personC: null,
                personB: null,
                personA: null
            },
            selfInterestAllocationSurvivors: null,
            selfInterestAllocationGini: null,
            selfInterestAllocationClassification: null,
            selfInterestAllocationTotalMoved: null,
            selfInterestAllocationMethod: null,
            selfInterestOwnStartingFood: null,
            selfInterestOwnFinalFood: null,
            selfInterestOwnChange: null,
            selfInterestEqualButtonUsed: false,
            selfInterestPartialButtonUsed: false,
            screenTimings: {},
            answerChoiceOrders: {},
            answerChoiceOrderHistory: {},
            treeClicks: {
                personC: 0,
                personB: 0,
                personA: 0
            },
            treeFruitCollected: {
                personC: 0,
                personB: 0,
                personA: 0
            },
            equalDivisionFinal: {
                personC: 0,
                personB: 0,
                personA: 0
            },
            saveStatus: null,
            completionMessageSent: false
        };
        this.questionObjects = [];
        this.gameObjects = [];
        this.instructionIndex = 0;
        this.answerButtons = [];
        this.navigationHistory = [];
        this.navigationIndex = -1;
        this.restoringScreen = false;
        this.foodCounts = {};
        this.selfInterestEqualApplied = false;
        this.selfInterestPartialApplied = false;
        this.selfInterestAllocationSource = 'starting_distribution';
        this.selfInterestDraft = null;
        this.instructionScreens = [
            'Welcome to the Survival Task. In this task, a group of three people find themselves lost in an otherwise uninhabited location.',
            'The people have been hunting and gathering food in order to survive. \n \nIf a person does not eat at least 8 pieces of food a day, he will not survive. \n \nIf a person collects more than 8 pieces of food a day, he can save the remainder for himself the next day.',
            'This location usually has just enough natural resources to provide food for the group.',
            'Person A usually collects the least pieces of food per day. \n \nPerson B usually collects more than Person A but less than Person C. \n \nPerson C usually collects the most pieces of food per day.',
            'You will make decisions about how the group distributes its food. Choose what you think is best for the group. Consider only the food shown. \n \nThe baskets show what each person collected today, before any sharing. If the group adopts a redistribution rule, everyone must follow it.'
        ];
        this.showInstructionScreen();
    }
    // Elapsed wall-clock milliseconds, including time spent in another tab.
    finishScreenTiming() {
        if (!this.activeTimingScreen) return;
        const elapsed = Math.max(0, performance.now() - this.activeScreenStartedAt);
        const name = this.activeTimingScreen;
        this.gameData.screenTimings[name] = (this.gameData.screenTimings[name] || 0) + elapsed;
        this.activeTimingScreen = null;
    }
    enterRecordedScreen(name, renderer = null) {
        this.finishScreenTiming();
        this.activeTimingScreen = name;
        this.activeScreenStartedAt = performance.now();
        this.screenAnswerOrders = {};
        if (!this.restoringScreen) {
            this.navigationHistory.length = this.navigationIndex + 1;
            this.navigationHistory.push({
                name,
                economicPrincipleIndex: this.economicPrincipleIndex,
                render: renderer || (typeof this[name] === 'function' ? () => this[name]() : null)
            });
            this.navigationIndex = this.navigationHistory.length - 1;
        }
    }
    goBack() {
        if (this.navigationIndex < 1) return;
        if (this.activeTimingScreen === 'self_interest_allocation') {
            this.selfInterestDraft = {
                counts: { ...this.selfInterestCounts },
                moveSize: this.selfInterestMoveSize,
                source: this.selfInterestAllocationSource,
                equalApplied: this.selfInterestEqualApplied,
                partialApplied: this.selfInterestPartialApplied,
                startedAt: this.allocationStartedAt
            };
        }
        let previousIndex = this.navigationIndex - 1;
        while (previousIndex >= 0 && !this.navigationHistory[previousIndex].render) previousIndex -= 1;
        if (previousIndex < 0) return;
        this.navigationIndex = previousIndex;
        this.restoringScreen = true;
        try {
            if (Number.isInteger(this.navigationHistory[previousIndex].economicPrincipleIndex)) {
                this.economicPrincipleIndex = this.navigationHistory[previousIndex].economicPrincipleIndex;
            }
            this.navigationHistory[previousIndex].render();
        } finally {
            this.restoringScreen = false;
        }
    }
    getStableAnswerOrder(variableName, answers) {
        const previous = this.gameData.answerChoiceOrders?.[variableName]?.map(choice => choice.label);
        return previous?.length === answers.length &&
            previous.every(label => answers.includes(label)) ? previous : answers;
    }
    recordDisplayedAnswer(variableName, value, label) {
        this.gameData.answerChoiceOrders ||= {};
        this.gameData.answerChoiceOrderHistory ||= {};
        this.screenAnswerOrders ||= {};
        if (!this.screenAnswerOrders[variableName]) {
            const order = [];
            this.screenAnswerOrders[variableName] = order;
            this.gameData.answerChoiceOrders[variableName] = order;
            (this.gameData.answerChoiceOrderHistory[variableName] ||= []).push(order);
        }
        // Buttons are created in displayed top-to-bottom order.
        this.screenAnswerOrders[variableName].push({ value, label });
    }
    getFixedFoodCounts() {
        return {
            personA: 1,
            personB: 6,
            personC: 17,
            total: 24
        };
    }
    getBasketFoodOffset(index, scale = 1) {
        return {
            x: (index % 4 - 1.5) * 8 * scale,
            y: (15 - Math.floor(index / 4) * 7.5) * scale
        };
    }
    createFoodFruit(x, y, scale = 1) {
        const fruit = this.add.circle(x, y, 4 * scale, 11674146);
        fruit.setStrokeStyle(1.25, 0);
        return fruit;
    }
    buildSurplusOnlyPartialAllocation() {
        const fixedFood = this.getFixedFoodCounts();
        const threshold = 8;
        const startingAllocation = [
            fixedFood.personC,
            fixedFood.personB,
            fixedFood.personA
        ];
        const allocation = [...startingAllocation];
        const donors = startingAllocation.map((amount, index) => ({
            index,
            surplus: Math.max(0, amount - threshold)
        })).filter(donor => donor.surplus > 0);
        const totalAvailableSurplus = donors.reduce((sum, donor) => sum + donor.surplus, 0);
        const recipients = startingAllocation.map((amount, index) => ({
            index,
            deficit: Math.max(0, threshold - amount),
            startingAmount: amount
        })).filter(recipient => recipient.deficit > 0).sort((left, right) => right.startingAmount - left.startingAmount || left.index - right.index);
        let remainingSurplus = totalAvailableSurplus;
        let totalTransferRequired = 0;
        recipients.forEach(recipient => {
            if (recipient.deficit <= remainingSurplus) {
                allocation[recipient.index] = threshold;
                remainingSurplus -= recipient.deficit;
                totalTransferRequired += recipient.deficit;
            }
        });
        if (totalTransferRequired === 0 || totalAvailableSurplus === 0) {
            return allocation;
        }
        /*
         * Give larger surpluses a higher contribution rate. Recalculate
         * the rate when a donor reaches the cap at their full surplus.
         */
        const exactContributions = new Map();
        let unassignedTransfer = totalTransferRequired;
        let uncappedDonors = [...donors];
        while (uncappedDonors.length > 0) {
            const totalWeight = uncappedDonors.reduce(
                (sum, donor) => sum + donor.surplus ** 2, 0
            );
            const rate = unassignedTransfer / totalWeight;
            const cappedDonors = uncappedDonors.filter(
                donor => rate * donor.surplus ** 2 >= donor.surplus
            );
            if (cappedDonors.length === 0) {
                uncappedDonors.forEach(donor => {
                    exactContributions.set(donor.index, rate * donor.surplus ** 2);
                });
                break;
            }
            const cappedIndexes = new Set(cappedDonors.map(donor => donor.index));
            cappedDonors.forEach(donor => {
                exactContributions.set(donor.index, donor.surplus);
                unassignedTransfer -= donor.surplus;
            });
            uncappedDonors = uncappedDonors.filter(
                donor => !cappedIndexes.has(donor.index)
            );
        }
        const contributionShares = donors.map(donor => {
            const exactContribution = exactContributions.get(donor.index);
            const baseContribution = Math.floor(exactContribution);
            return {
                ...donor,
                contribution: Math.min(baseContribution, donor.surplus),
                remainder: exactContribution - baseContribution
            };
        });
        let assignedContributions = contributionShares.reduce((sum, donor) => sum + donor.contribution, 0);
        /*
     * Food is measured in whole pieces. Assign any
     * remaining pieces using the largest-remainder method.
     */
        contributionShares.sort((left, right) => right.remainder - left.remainder || right.surplus - left.surplus || left.index - right.index);
        let donorCursor = 0;
        while (assignedContributions < totalTransferRequired) {
            const donor = contributionShares[donorCursor % contributionShares.length];
            if (donor.contribution < donor.surplus) {
                donor.contribution += 1;
                assignedContributions += 1;
            }
            donorCursor += 1;
        }
        contributionShares.forEach(donor => {
            allocation[donor.index] -= donor.contribution;
        });
        return allocation;
    }
    normalizeParentOrigin(parentOrigin) {
        try {
            const parsedOrigin = new URL(parentOrigin);
            if (parsedOrigin.protocol !== 'https:' && parsedOrigin.protocol !== 'http:') {
                return null;
            }
            return parsedOrigin.origin;
        } catch (error) {
            return null;
        }
    }
    assignSelfInterestPerson() {
        const people = ['Person A', 'Person B', 'Person C'];
        const assignmentId = this.gameData.gameId || this.gameData.qualtricsId;
        const storageKey = assignmentId ? `survivalGameSelfInterestPerson:${ assignmentId }` : null;
        if (storageKey) {
            try {
                const storedPerson = sessionStorage.getItem(storageKey);
                if (people.includes(storedPerson)) {
                    return storedPerson;
                }
            } catch (error) {
            }
        }
        let randomValue = Math.random();
        if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
            const randomArray = new Uint32Array(1);
            window.crypto.getRandomValues(randomArray);
            randomValue = randomArray[0] / 4294967296;
        }
        const assignedPerson = people[Math.floor(randomValue * people.length)];
        if (storageKey) {
            try {
                sessionStorage.setItem(storageKey, assignedPerson);
            } catch (error) {
            }
        }
        return assignedPerson;
    }
    isMobileDevice() {
        return window.innerWidth < 900 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    }
    isPortraitMode() {
        return window.innerHeight > window.innerWidth;
    }
    showRotatePhoneScreen(nextFunction) {
        this.enterRecordedScreen('showRotatePhoneScreen', () => this.showRotatePhoneScreen(nextFunction));
        this.clearQuestionScreen();
        this.clearGameObjects();
        this.addQuestionObject(this.add.rectangle(640, 360, 1080, 430, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(640, 310, 'If you are using a cell phone, please rotate your phone sideways to continue.', {
            fontSize: '34px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 900 }
        }).setOrigin(0.5));
        this.createNextButton(640, 520, 'Continue', () => {
            nextFunction.call(this);
        });
    }
    showInstructionScreen() {
        const instructionIndex = this.instructionIndex;
        this.enterRecordedScreen('instruction_' + (instructionIndex + 1), () => {
            this.instructionIndex = instructionIndex;
            this.showInstructionScreen();
        });
        this.cameras.main.setBackgroundColor('#ffffff');
        this.clearQuestionScreen();
        this.addQuestionObject(this.add.rectangle(640, 360, 1000, 500, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(260, 145, 'Instructions', {
            fontSize: '36px',
            color: '#000000'
        }));
        const instructionStyle = {
            fontSize: '27px',
            color: '#000000',
            wordWrap: { width: 760 },
            lineSpacing: 8
        };
        if (this.instructionIndex === 2) {
            instructionStyle.fontStyle = 'bold';
        }
        if (this.instructionIndex === 1) {
            instructionStyle.fontSize = '25px';
            instructionStyle.wordWrap = { width: 585 };
        }
        this.addQuestionObject(this.add.text(
            this.instructionIndex === 1 ? 195 : 260,
            this.instructionIndex === 1 ? 220 : 275,
            this.instructionScreens[this.instructionIndex], instructionStyle));
        if (this.instructionIndex === 1) this.showSurvivalThresholdExample();
        this.createNextButton(640, 675, 'Next', () => {
            this.instructionIndex += 1;
            if (this.instructionIndex < this.instructionScreens.length) {
                this.showInstructionScreen();
            } else {
                this.showSurvivalCheckQuestion();
            }
        });
    }
    showSurvivalThresholdExample() {
        const centerX = 975;
        const fruitScale = 3.5;
        for (let index = 0; index < 8; index += 1) {
            const fruitX = centerX + (index % 4 - 1.5) * 40;
            const fruitY = 355 + Math.floor(index / 4) * 40;
            this.addQuestionObject(this.createFoodFruit(fruitX, fruitY, fruitScale));
        }
        this.addQuestionObject(this.add.text(centerX, 470, '8 pieces', {
            fontSize: '24px',
            color: '#000000'
        }).setOrigin(0.5));
    }
    showSurvivalCheckQuestion() {
        this.enterRecordedScreen('showSurvivalCheckQuestion');
        this.clearQuestionScreen();
        this.addQuestionObject(this.add.rectangle(640, 360, 900, 450, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(250, 175, 'How many pieces of food does each person need to survive the day?', {
            fontSize: '30px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 780 }
        }));
        let choices = [6, 8, 10];
        if (Phaser.Math.Between(0, 1) === 1) choices.reverse();
        const previousChoices = this.gameData.answerChoiceOrders?.survivalCheck
            ?.map(choice => Number.parseInt(choice.label, 10));
        if (previousChoices?.length === choices.length &&
            previousChoices.every(amount => choices.includes(amount))) choices = previousChoices;
        choices.forEach((amount, index) => this.createSurvivalCheckButton(640, 340 + index * 80, amount + ' pieces', amount === 8));

    }
    createSurvivalCheckButton(centerX, centerY, label, isCorrect) {
        this.recordDisplayedAnswer('survivalCheck', label, label);
        const paddingX = 24;
        const paddingY = 14;
        const text = this.add.text(centerX, centerY, label, {
            fontSize: this.phonePortrait ? '32px' : '24px',
            color: '#000000'
        }).setOrigin(0.5);
        const button = this.add.rectangle(centerX, centerY,
            this.phonePortrait ? 560 : text.width + paddingX * 2,
            this.phonePortrait ? 100 : text.height + paddingY * 2, 14540253);
        button._portraitNativeSize = this.phonePortrait;
        button.setStrokeStyle(2, 0);
        button.setInteractive(new Phaser.Geom.Rectangle(-(button.width + 40) / 2, -(button.height + 30) / 2, button.width + 40, button.height + 30), Phaser.Geom.Rectangle.Contains);
        button.setDepth(1);
        text.setDepth(2);
        this.addQuestionObject(button);
        this.addQuestionObject(text);
        button.on('pointerdown', () => {
            if (this.gameData.thresholdCheckChoice === null) {
                this.gameData.survivalCheck = label;
                this.gameData.thresholdCheckChoice = label;
                this.gameData.thresholdCheckPassed = isCorrect;
            }
            if (isCorrect) {
                this.showSurvivalCheckFeedback('Correct.');
            } else {
                this.showSurvivalCheckFeedback('No, each person needs 8 pieces of food a day to survive.');
            }
        });
    }
    showSurvivalCheckFeedback(message) {
        this.enterRecordedScreen('showSurvivalCheckFeedback', () => this.showSurvivalCheckFeedback(message));
        this.clearQuestionScreen();
        this.addQuestionObject(this.add.rectangle(640, 360, 900, 320, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(250, 290, message, {
            fontSize: '30px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 780 }
        }));
        this.createNextButton(640, 520, 'Start Task', () => {
            this.startFoodCollectionTask();
        });
    }
    startFoodCollectionTask() {
        this.enterRecordedScreen('startFoodCollectionTask');
        this.clearQuestionScreen();
        this.clearGameObjects();
        this.foodCounts = {
            'Person C': 0,
            'Person B': 0,
            'Person A': 0
        };
        this.addGameObject(this.add.text(40, 60, 'Click each person, then click the tree to collect food for that person. Repeat until all three people have collected food. Select Next to continue.', {
            fontSize: '26px',
            color: '#000000',
            wordWrap: { width: 900 },
            lineSpacing: 6,
            backgroundColor: '#ffffff',
            padding: {
                x: 12,
                y: 8
            }
        }));
        this.drawTree();
        this.avatars = [];
        this.selectedAvatar = null;
        this.foodCollectionNextShown = false;
        const baselineY = 360;
        const personC = this.createHumanAvatar(730, baselineY, 'Person C', 1.08, 13382451, 0);
        const personB = this.createHumanAvatar(450, baselineY, 'Person B', 1, 3368652, 0);
        const personA = this.createHumanAvatar(170, baselineY, 'Person A', 1, 3381606, 0);
        this.avatars.push(personC, personB, personA);
    }
    drawTree() {
        const woodColor = 9132587;
        this.addGameObject(this.add.rectangle(1085, 390, 50, 145, woodColor));
        // Exposed limbs and separate foliage clusters keep this between the
        // bare insufficiency tree and the fuller abundance tree.
        [
            [1038, 330, 115, 10, 40],
            [1132, 330, 125, 10, -30],
            [1062, 280, 110, 7, 67],
            [1108, 280, 110, 7, -67]
        ].forEach(([x, y, width, height, angle]) => {
            const branch = this.add.rectangle(x, y, width, height, woodColor);
            branch.setAngle(angle);
            this.addGameObject(branch);
        });
        [
            [1042, 229, 100, 66, 2062894],
            [1128, 221, 128, 72, 2329141],
            [1015, 275, 82, 72, 3119930],
            [1153, 283, 90, 80, 3976520]
        ].forEach(([x, y, width, height, color]) => {
            this.addGameObject(this.add.ellipse(x, y, width, height, color));
        });
        const fruitPositions = [
            [-45, -75], [20, -82], [52, -63],
            [-75, -30], [0, -45], [38, -35],
            [-48, 18], [68, 28]
        ];
        // Tree fruit is illustrative; basket totals come from getFixedFoodCounts().
        fruitPositions.forEach(position => {
            const fruit = this.createFoodFruit(1085 + position[0], 285 + position[1]);
            this.addGameObject(fruit);
        });
        const treeClickZone = this.add.zone(1085, 305, 340, 380);
        treeClickZone.setInteractive({ useHandCursor: true });
        treeClickZone.on('pointerdown', () => {
            this.collectFoodFromTree();
        });
        this.addGameObject(treeClickZone);
    }
    createBasket(x, y, scale) {
        const basket = this.add.container(x, y);
        const basketColor = 12089650;
        const basketDark = 6042903;
        const basketLight = 14195274;
        const handle = this.add.arc(0, -22 * scale, 18 * scale, 205, 335, true);
        handle.setStrokeStyle(4 * scale, basketDark);
        const body = this.add.rectangle(0, 2.5 * scale, 34 * scale, 37 * scale, basketColor);
        body.setStrokeStyle(2 * scale, basketDark);
        const rim = this.add.rectangle(0, -15 * scale, 40 * scale, 8 * scale, basketLight);
        rim.setStrokeStyle(2 * scale, basketDark);
        basket.add([
            handle,
            body,
            rim
        ]);
        return basket;
    }
    createBasketThresholdMarker(x, y, scale) {
        // Eight fruits fill two rows of four; mark the top edge of that stack.
        const eighthFruitTop = this.getBasketFoodOffset(7, scale).y - 4 * scale;
        return this.add.rectangle(x, y + eighthFruitTop, 32 * scale, 3, 0x5c3517);
    }
    createHumanAvatar(x, y, label, scale, shirtColor, startingFood = 0) {
        const avatar = this.add.container(x, y);
        const skinColor = 11893327;
        const hairColor = 7028509;
        const pantsColor = 3355443;
        avatar.add([
            this.add.rectangle(0, -18 * scale, 10 * scale, 14 * scale, skinColor),
            this.add.circle(0, -43 * scale, 24 * scale, skinColor),
            this.add.ellipse(0, -64 * scale, 46 * scale, 18 * scale, hairColor),
            this.add.ellipse(-17 * scale, -55 * scale, 12 * scale, 18 * scale, hairColor),
            this.add.ellipse(17 * scale, -55 * scale, 12 * scale, 18 * scale, hairColor),
            this.add.circle(-8 * scale, -43 * scale, 2.7 * scale, 0),
            this.add.circle(8 * scale, -43 * scale, 2.7 * scale, 0),
            this.add.rectangle(0, -35 * scale, 3 * scale, 9 * scale, 10181678),
            this.add.rectangle(0, -27 * scale, 12 * scale, 2 * scale, 0),
            this.add.rectangle(0, 8 * scale, 46 * scale, 64 * scale, shirtColor),
            this.add.rectangle(-32 * scale, 10 * scale, 10 * scale, 52 * scale, skinColor),
            this.add.rectangle(32 * scale, 10 * scale, 10 * scale, 52 * scale, skinColor),
            this.createBasket(39 * scale, 31 * scale, scale),
            this.add.rectangle(-12 * scale, 71 * scale, 14 * scale, 48 * scale, pantsColor),
            this.add.rectangle(12 * scale, 71 * scale, 14 * scale, 48 * scale, pantsColor),
            this.add.text(0, 135 * scale, label, {
                fontSize: this.phonePortrait ? '32px' : '22px',
                color: '#000000'
            }).setOrigin(0.5)
        ]);
        const selectPerson = () => {
            this.selectAvatar(avatar);
        };
        const clickZones = [
            this.add.zone(0, -47 * scale, 70 * scale, 65 * scale),
            this.add.zone(0, 8 * scale, 65 * scale, 78 * scale),
            this.add.zone(-32 * scale, 10 * scale, 32 * scale, 70 * scale),
            this.add.zone(32 * scale, 10 * scale, 32 * scale, 70 * scale),
            this.add.zone(39 * scale, 25.5 * scale, 60 * scale, 76 * scale),
            this.add.zone(-12 * scale, 75 * scale, 32 * scale, 65 * scale),
            this.add.zone(12 * scale, 75 * scale, 32 * scale, 65 * scale)
        ];
        clickZones.forEach(zone => {
            zone.setInteractive({ useHandCursor: true });
            zone.on('pointerdown', selectPerson);
            avatar.add(zone);
        });
        avatar.personLabel = label;
        avatar.foodCount = 0;
        avatar.basketScale = scale;
        for (let i = 0; i < startingFood; i += 1) {
            avatar.foodCount += 1;
            const position = avatar.foodCount - 1;
            const appleX = 39 * scale + this.getBasketFoodOffset(position, scale).x;
            const appleY = 31 * scale + this.getBasketFoodOffset(position, scale).y;
            avatar.add(this.createFoodFruit(appleX, appleY, scale));
        }
        this.addGameObject(avatar);
        const marker = this.createBasketThresholdMarker(x + 39 * scale, y + 31 * scale, scale).setDepth(101);
        if (this.phonePortrait) {
            marker.setPosition(avatar.x + 39 * scale, avatar.y + 31 * scale + this.getBasketFoodOffset(7, scale).y - 4 * scale);
            marker._portraitPositioned = true;
        }
        this.addGameObject(marker);
        return avatar;
    }
    showFoodCollectionNextButtonIfReady() {
        const allThreeCollected = this.foodCounts['Person C'] > 0 && this.foodCounts['Person B'] > 0 && this.foodCounts['Person A'] > 0;
        if (allThreeCollected && !this.foodCollectionNextShown) {
            this.foodCollectionNextShown = true;
            this.createGameNextButton(640, 675, 'Next', () => {
                this.showDistributionDisplay();
            });
        }
    }
    collectFoodFromTree() {
        if (!this.selectedAvatar) {
            return;
        }
        const fixedFood = this.getFixedFoodCounts();
        const person = this.selectedAvatar.personLabel;
        if (person === 'Person C') {
            this.gameData.treeClicks.personC += 1;
            if (this.foodCounts[person] > 0) {
                return;
            }
            this.foodCounts[person] = fixedFood.personC;
            this.gameData.treeFruitCollected.personC = fixedFood.personC;
            this.addFoodToBasket(this.selectedAvatar, fixedFood.personC);
            this.showFoodCollectionNextButtonIfReady();
            return;
        }
        if (person === 'Person B') {
            this.gameData.treeClicks.personB += 1;
            if (this.foodCounts[person] > 0) {
                return;
            }
            this.foodCounts[person] = fixedFood.personB;
            this.gameData.treeFruitCollected.personB = fixedFood.personB;
            this.addFoodToBasket(this.selectedAvatar, fixedFood.personB);
            this.showFoodCollectionNextButtonIfReady();
            return;
        }
        if (person === 'Person A') {
            this.gameData.treeClicks.personA += 1;
            if (this.foodCounts[person] > 0) {
                return;
            }
            this.foodCounts[person] = fixedFood.personA;
            this.gameData.treeFruitCollected.personA = fixedFood.personA;
            this.addFoodToBasket(this.selectedAvatar, fixedFood.personA);
            this.showFoodCollectionNextButtonIfReady();
        }
    }
    addFoodToBasket(avatar, amount) {
        const scale = avatar.basketScale;
        for (let i = 0; i < amount; i += 1) {
            avatar.foodCount += 1;
            const position = avatar.foodCount - 1;
            const appleX = 39 * scale + this.getBasketFoodOffset(position, scale).x;
            const appleY = 31 * scale + this.getBasketFoodOffset(position, scale).y;
            avatar.add(this.createFoodFruit(appleX, appleY, scale));
        }
    }
    selectAvatar(avatar) {
        this.selectedAvatar = avatar;
        this.avatars.forEach(person => {
            if (person.selectionBox) {
                person.selectionBox.destroy();
                person.selectionBox = null;
            }
            person.setDepth(10);
        });
        avatar.setDepth(100);
        avatar.selectionBox = this.add.rectangle(avatar.x, avatar.y, 180, 260, 0, 0);
        avatar.selectionBox._portraitPositioned = true;
        avatar.selectionBox.setStrokeStyle(4, 0);
        avatar.selectionBox.setDepth(99);
        this.addGameObject(avatar.selectionBox);
    }
    update() {
    }
    showDistributionDisplay() {
        this.enterRecordedScreen('showDistributionDisplay');
        this.clearGameObjects();
        this.clearQuestionScreen();
        this.cameras.main.setBackgroundColor('#ffffff');
        const fixedFood = this.getFixedFoodCounts();
        this.blanketFoodCount = 0;
        this.totalFoodToCount = fixedFood.total;
        this.distributionNextShown = false;
        this.countingSelectedPerson = null;
        this.countingFoodsByPerson = {
            'Person C': [],
            'Person B': [],
            'Person A': []
        };
        this.countingPersonCompleted = {
            'Person C': false,
            'Person B': false,
            'Person A': false
        };
        this.countingPersonSelectors = {};
        const baselineY = 170;
        const people = [
            {
                label: 'Person C',
                x: 1000,
                scale: 1.12,
                color: 13382451,
                foodAmount: fixedFood.personC
            },
            {
                label: 'Person B',
                x: 620,
                scale: 1,
                color: 3368652,
                foodAmount: fixedFood.personB
            },
            {
                label: 'Person A',
                x: 230,
                scale: 0.88,
                color: 3381606,
                foodAmount: fixedFood.personA
            }
        ];
        people.forEach(person => {
            this.addQuestionObject(this.createStaticHumanAvatar(person.x, baselineY, person.label, person.scale, person.color, 0, true, 160));
            const selector = this.add.rectangle(person.x, baselineY, 210, 270, 16777215, 0);
            selector.setInteractive({ useHandCursor: true });
            selector.setDepth(5);
            selector.on('pointerdown', () => {
                this.selectPersonForFoodDump(person.label);
            });
            this.countingPersonSelectors[person.label] = selector;
            this.addQuestionObject(selector);
            this.createCountingFoodPieces(person.x, baselineY, person.scale, person.foodAmount, person.label);
        });
        this.blanket = this.add.rectangle(640, 425, 420, 115, 14216447);
        this.blanket.setStrokeStyle(4, 3364215);
        this.blanket.setDepth(1);
        this.blanket.setInteractive({ useHandCursor: true });
        this.blanket.on('pointerdown', () => {
            this.dumpSelectedPersonFoodToBlanket();
        });
        this.addQuestionObject(this.blanket);
        const blanketLabel = this.add.text(640, 425, 'Blanket', {
            fontSize: '24px',
            color: '#000000'
        }).setOrigin(0.5);
        blanketLabel.setDepth(2);
        this.addQuestionObject(blanketLabel);
        this.blanketCounterText = this.add.text(640, 515, 'Pieces counted: 0', {
            fontSize: '26px',
            color: '#000000'
        }).setOrigin(0.5);
        this.blanketCounterText.setDepth(2);
        this.addQuestionObject(this.blanketCounterText);
        this.countingInstructionText = this.add.text(640, 575, 'Click a person, then click the blanket to count all of that person\'s food.', {
            fontSize: '22px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 }
        }).setOrigin(0.5);
        this.addQuestionObject(this.countingInstructionText);
    }
    createCountingFoodPieces(avatarX, avatarY, scale, foodAmount, personLabel) {
        for (let i = 0; i < foodAmount; i += 1) {
            const foodX = (this.phonePortrait ? this.portraitX(avatarX) : avatarX) + 39 * scale + this.getBasketFoodOffset(i, scale).x;
            const foodY = (this.phonePortrait ? this.portraitY(avatarY) : avatarY) + 31 * scale + this.getBasketFoodOffset(i, scale).y;
            const food = this.createFoodFruit(foodX, foodY, scale);
            food._portraitPositioned = this.phonePortrait;
            food.setDepth(10);
            food.counted = false;
            food.sourcePerson = personLabel;
            this.countingFoodsByPerson[personLabel].push(food);
            this.addQuestionObject(food);
        }
    }
    getCountingBlanketFoodPosition(index) {
        const side = index % 2 === 0 ? -1 : 1;
        const slot = Math.floor(index / 2);
        return [side * (90 + slot % 3 * 35), -42 + Math.floor(slot / 3) * 24];
    }
    selectPersonForFoodDump(personLabel) {
        if (this.countingPersonCompleted[personLabel]) {
            this.countingSelectedPerson = null;
            this.countingInstructionText.setText(`${ personLabel }'s food has already been counted.`);
            return;
        }
        this.countingSelectedPerson = personLabel;
        Object.entries(this.countingPersonSelectors).forEach(([label, selector]) => {
            if (this.countingPersonCompleted[label]) {
                selector.setStrokeStyle(3, 7829367, 1);
            } else if (label === personLabel) {
                selector.setStrokeStyle(5, 1797946, 1);
            } else {
                selector.setStrokeStyle(0, 1797946, 0);
            }
        });
        this.countingInstructionText.setText(`${ personLabel } selected. Now click the blanket.`);
    }
    dumpSelectedPersonFoodToBlanket() {
        if (!this.countingSelectedPerson) {
            this.countingInstructionText.setText('Select a person first, then click the blanket.');
            return;
        }
        const selectedPerson = this.countingSelectedPerson;
        const remainingFood = this.countingFoodsByPerson[selectedPerson].filter(food => !food.counted);
        if (remainingFood.length === 0) {
            this.countingSelectedPerson = null;
            this.countingInstructionText.setText(`${ selectedPerson }'s food has already been counted.`);
            return;
        }
        this.gameData.totalFoodCountPersonDumps += 1;
        remainingFood.forEach(food => {
            const blanketPosition = this.getCountingBlanketFoodPosition(this.blanketFoodCount);
            food.counted = true;
            food.x = this.blanket.x + blanketPosition[0];
            food.y = this.blanket.y + blanketPosition[1];
            food.setDepth(20);
            this.blanketFoodCount += 1;
        });
        this.countingPersonCompleted[selectedPerson] = true;
        this.blanketCounterText.setText(`Pieces counted: ${ this.blanketFoodCount }`);
        this.countingInstructionText.setText(`${ selectedPerson }'s food is on the blanket.`);
        this.countingSelectedPerson = null;
        Object.entries(this.countingPersonSelectors).forEach(([label, selector]) => {
            if (this.countingPersonCompleted[label]) {
                selector.setStrokeStyle(3, 7829367, 1);
            } else {
                selector.setStrokeStyle(0, 1797946, 0);
            }
        });
        this.showTotalFoodCountNextButtonIfReady();
    }
    showTotalFoodCountNextButtonIfReady() {
        if (this.blanketFoodCount === this.totalFoodToCount && !this.distributionNextShown) {
            this.distributionNextShown = true;
            this.time.delayedCall(100, () => {
                this.createNextButton(640, 675, 'Next', () => {
                    this.showFoodPolicyTransition('Arrange food', 'First, choose how to arrange the food among the members of the group.', () => this.startSelfInterestAllocation('initial'), 'Task 1');
                });
            });
        }
    }
    createDraggableFoodPieces(avatarX, avatarY, scale, foodAmount) {
        const getBlanketFoodPosition = index => {
            const positions = [
                [
                    -150,
                    -25
                ],
                [
                    -115,
                    -25
                ],
                [
                    -80,
                    -25
                ],
                [
                    -150,
                    10
                ],
                [
                    -115,
                    10
                ],
                [
                    -80,
                    10
                ],
                [
                    80,
                    -25
                ],
                [
                    115,
                    -25
                ],
                [
                    150,
                    -25
                ],
                [
                    80,
                    10
                ],
                [
                    115,
                    10
                ],
                [
                    150,
                    10
                ],
                [
                    -150,
                    45
                ],
                [
                    -115,
                    45
                ],
                [
                    -80,
                    45
                ],
                [
                    80,
                    45
                ],
                [
                    115,
                    45
                ],
                [
                    150,
                    45
                ]
            ];
            return positions[index];
        };
        for (let i = 0; i < foodAmount; i += 1) {
            const position = i;
            const startX = avatarX + 39 * scale + this.getBasketFoodOffset(position, scale).x;
            const startY = avatarY + 31 * scale + this.getBasketFoodOffset(position, scale).y;
            const food = this.createFoodFruit(startX, startY, scale);
            food.setInteractive(new Phaser.Geom.Circle(0, 0, 28), Phaser.Geom.Circle.Contains, { useHandCursor: true });
            food.setDepth(10);
            food.startX = startX;
            food.startY = startY;
            food.counted = false;
            this.input.setDraggable(food);
            food.on('dragstart', () => {
                food.setDepth(20);
            });
            food.on('drag', (pointer, dragX, dragY) => {
                food.x = dragX;
                food.y = dragY;
            });
            food.on('dragend', () => {
                const blanketBounds = this.blanket.getBounds();
                if (Phaser.Geom.Rectangle.Contains(blanketBounds, food.x, food.y)) {
                    if (!food.counted) {
                        food.counted = true;
                        this.blanketFoodCount += 1;
                        const pilePosition = this.blanketFoodCount - 1;
                        const blanketPosition = getBlanketFoodPosition(pilePosition);
                        food.x = this.blanket.x + blanketPosition[0];
                        food.y = this.blanket.y + blanketPosition[1];
                        this.blanketCounterText.setText(`Pieces counted: ${ this.blanketFoodCount }`);
                        if (this.blanketFoodCount === this.totalFoodToCount && !this.distributionNextShown) {
                            this.distributionNextShown = true;
                            this.time.delayedCall(100, () => {
                                this.createNextButton(640, 675, 'Next', () => {
                                    this.showFoodPolicyTransition('Arrange food', 'First, choose how to arrange the food among the members of the group.', () => this.startSelfInterestAllocation('initial'), 'Task 1');
                                });
                            });
                        }
                    }
                    food.setDepth(20);
                } else {
                    if (!food.counted) {
                        food.x = food.startX;
                        food.y = food.startY;
                    }
                    food.setDepth(10);
                }
            });
            this.addQuestionObject(food);
        }
    }
    showRedistributionBlock(index = 0) {
        if (!this.gameData.redistributionTaskOrder) {
            this.gameData.redistributionTaskOrder = Phaser.Math.Between(0, 1) === 0
                ? ['equal', 'partial'] : ['partial', 'equal'];
            this.gameData.redistributionBlocksCompleted = [];
        }
        const block = this.gameData.redistributionTaskOrder[index];
        if (!block) {
            this.showRedistributionFeasibility();
            return;
        }
        const ordinal = index === 0 ? 'Second' : 'Third';
        const detail = block === 'equal'
            ? `${ordinal}, see what happens when you divide the food equally among the members of the group.`
            : `${ordinal}, see what happens when you move food from people with more than 8 pieces of food to members of the group with less.`;
        this.showFoodPolicyTransition(block === 'equal' ? 'Equalize food' : 'Redistribute food', detail, () => {
            if (block === 'equal') this.showEqualDivisionTask();
            else this.showPartialRedistributionTask();
        }, `Task ${index + 2}`);
    }
    completeRedistributionBlock(block) {
        const order = this.gameData.redistributionTaskOrder;
        if (!order || !order.includes(block)) throw new Error('Redistribution block order missing');
        if (!this.gameData.redistributionBlocksCompleted.includes(block)) {
            this.gameData.redistributionBlocksCompleted.push(block);
        }
        this.showRedistributionBlock(order.indexOf(block) + 1);
    }

    showEqualDivisionTask(restoreOriginal = false) {
        this.enterRecordedScreen('showEqualDivisionTask');
        this.clearQuestionScreen();
        const fixedFood = this.getFixedFoodCounts();
        const totalFood = fixedFood.total;
        const roleLabels = [
            'Person C',
            'Person B',
            'Person A'
        ];
        const equalShare = totalFood / roleLabels.length;
        this.equalDivisionCounts = {
            'Person C': 0,
            'Person B': 0,
            'Person A': 0
        };
        this.equalDivisionAssignedCount = 0;
        this.equalDivisionCompleted = false;
        this.equalDivisionNextShown = false;
        this.equalDivisionFoods = [];
        this.equalDivisionInstructionText = this.add.text(640, 45, 'Click the blanket to divide the food equally among all three people.', {
            fontSize: '27px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 1000 }
        }).setOrigin(0.5);
        this.addQuestionObject(this.equalDivisionInstructionText);
        this.equalDivisionBlanket = this.add.rectangle(640, 195, 500, 130, 14216447);
        this.equalDivisionBlanket.setStrokeStyle(4, 3364215);
        this.equalDivisionBlanket.setDepth(1);
        this.equalDivisionBlanket.setInteractive({ useHandCursor: true });
        this.addQuestionObject(this.equalDivisionBlanket);
        this.equalDivisionBlanketLabel = this.add.text(640, 285, 'Click the blanket', {
            fontSize: '24px',
            color: '#000000'
        }).setOrigin(0.5);
        this.equalDivisionBlanketLabel.setDepth(2);
        this.addQuestionObject(this.equalDivisionBlanketLabel);
        const baselineY = 430;
        this.equalDivisionBaselineY = baselineY;
        this.addQuestionObject(this.createStaticHumanAvatar(1020, baselineY, 'Person C', 1.05, 13382451, 0));
        this.addQuestionObject(this.createStaticHumanAvatar(640, baselineY, 'Person B', 1, 3368652, 0));
        this.addQuestionObject(this.createStaticHumanAvatar(260, baselineY, 'Person A', 0.9, 3381606, 0));
        this.createEqualDivisionFoodPieces(totalFood);
        if (restoreOriginal) {
            const counts = [fixedFood.personC, fixedFood.personB, fixedFood.personA];
            const scales = [1.05, 1, 0.9];
            const centers = [1020, 640, 260];
            let foodIndex = 0;
            roleLabels.forEach((role, index) => {
                const scale = scales[index];
                for (let pile = 0; pile < counts[index]; pile++) {
                    const food = this.equalDivisionFoods[foodIndex++];
                    food.assignedPerson = role;
                    food.x = (this.phonePortrait ? this.portraitX(centers[index]) : centers[index]) + 39 * scale + this.getBasketFoodOffset(pile, scale).x;
                    food.y = (this.phonePortrait ? this.portraitY(baselineY) : baselineY) + 31 * scale + this.getBasketFoodOffset(pile, scale).y;
                    food.setDepth(20);
                }
                this.equalDivisionCounts[role] = counts[index];
            });
            this.equalDivisionAssignedCount = totalFood;
        }
        this.createSelfInterestActionButton(105, 675, 150, 'Reset', () => {
            this.showEqualDivisionTask(true);
        }, 14540253, '#000000');
        this.equalDivisionBlanket.on('pointerdown', () => {
            if (this.equalDivisionCompleted) {
                return;
            }
            const basketPositions = {
                'Person C': {
                    x: (this.phonePortrait ? this.portraitX(1020) : 1020) + 39 * 1.05,
                    y: (this.phonePortrait ? this.portraitY(this.equalDivisionBaselineY) : this.equalDivisionBaselineY) + 31 * 1.05,
                    scale: 1.05
                },
                'Person B': {
                    x: (this.phonePortrait ? this.portraitX(640) : 640) + 39,
                    y: (this.phonePortrait ? this.portraitY(this.equalDivisionBaselineY) : this.equalDivisionBaselineY) + 31,
                    scale: 1
                },
                'Person A': {
                    x: (this.phonePortrait ? this.portraitX(260) : 260) + 39 * 0.9,
                    y: (this.phonePortrait ? this.portraitY(this.equalDivisionBaselineY) : this.equalDivisionBaselineY) + 31 * 0.9,
                    scale: 0.9
                }
            };
            this.equalDivisionFoods.forEach((food, index) => {
                const roleIndex = Math.floor(index / equalShare);
                const roleLabel = roleLabels[roleIndex];
                const pilePosition = index % equalShare;
                const basket = basketPositions[roleLabel];
                food.assignedPerson = roleLabel;
                food.x = basket.x + this.getBasketFoodOffset(pilePosition, basket.scale).x;
                food.y = basket.y + this.getBasketFoodOffset(pilePosition, basket.scale).y;
                food.setDepth(20);
            });
            this.equalDivisionCounts = {
                'Person C': equalShare,
                'Person B': equalShare,
                'Person A': equalShare
            };
            this.equalDivisionAssignedCount = totalFood;
            this.equalDivisionCompleted = true;
            this.gameData.equalDivisionShortcutUsed = true;
            this.equalDivisionBlanket.disableInteractive();
            this.equalDivisionBlanket.setFillStyle(13097451);
            this.equalDivisionBlanketLabel.setText('Food divided equally');
            this.equalDivisionInstructionText.setText(`The food has been divided equally. \n \n Each person now has ${ equalShare } pieces.`);
            if (!this.equalDivisionNextShown) {
                this.equalDivisionNextShown = true;
                this.createNextButton(640, 675, 'Next', () => {
                    this.gameData.equalDivisionFinal.personC = this.equalDivisionCounts['Person C'];
                    this.gameData.equalDivisionFinal.personB = this.equalDivisionCounts['Person B'];
                    this.gameData.equalDivisionFinal.personA = this.equalDivisionCounts['Person A'];
                    this.showRedistributionGroupInterestQuestion('equal');
                });
            }
        });

        ;
    }
    createEqualDivisionFoodPieces(totalFood) {
        this.equalDivisionFoods = [];
        for (let i = 0; i < totalFood; i += 1) {
            const position = this.getCountingBlanketFoodPosition(i);
            const food = this.createFoodFruit(this.equalDivisionBlanket.x + position[0], this.equalDivisionBlanket.y + position[1]);
            food._portraitPositioned = this.phonePortrait;
            food.setDepth(10);
            food.assignedPerson = null;
            this.equalDivisionFoods.push(food);
            this.addQuestionObject(food);
        }
    }
    showPerCapitaQuestion() {
        this.enterRecordedScreen('showPerCapitaQuestion');
        this.clearQuestionScreen();
        this.addQuestionObject(this.add.rectangle(640, 360, 900, 450, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(230, 170, 'After dividing the food equally, how many people had at least 8 pieces?', {
            fontSize: '28px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 820 }
        }));
        let answers = [
            '0 people',
            '2 people',
            '3 people'
        ];
        if (Phaser.Math.Between(0, 1) === 1) answers.reverse();
        answers = this.getStableAnswerOrder('equalDivisionOutcomeChoice', answers);
        answers.forEach((label, index) => this.createAnswerButton(640, 365 + index * 80, label, 'equalDivisionOutcomeChoice'));

        ;
    }
    showRedistributionGroupInterestQuestion(block) {
        const equal = block === 'equal';
        const variableName = equal ? 'equalGroupInterestChoice' : 'partialGroupInterestChoice';
        this.enterRecordedScreen(
            equal ? 'equal_group_interest' : 'partial_group_interest',
            () => this.showRedistributionGroupInterestQuestion(block)
        );
        this.clearQuestionScreen();
        const fixedFood = this.getFixedFoodCounts();
        this.addQuestionObject(this.createStaticHumanAvatar(980, 115, 'Person C', 0.78, 13382451, fixedFood.personC));
        this.addQuestionObject(this.createStaticHumanAvatar(640, 115, 'Person B', 0.72, 3368652, fixedFood.personB));
        this.addQuestionObject(this.createStaticHumanAvatar(260, 115, 'Person A', 0.66, 3381606, fixedFood.personA));
        this.addQuestionObject(this.add.rectangle(640, 455, 1180, 320, 16777215).setStrokeStyle(4, 0));
        this.addQuestionObject(this.add.text(640, 350, 'Which arrangement do you think is better for the group as a whole?', {
            fontSize: '27px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 1000 }
        }).setOrigin(0.5));
        const answers = this.getStableAnswerOrder(variableName, Phaser.Utils.Array.Shuffle([
            equal
                ? 'Divide the food equally among all three people.'
                : 'Redistribute food so as many people as possible get at least 8 pieces.',
            'Let each person keep the food they collected.'
        ]));
        this.createAnswerButton(640, 455, answers[0], variableName);
        this.createAnswerButton(640, 555, answers[1], variableName);
    }
    showGroupDistributionPreferenceQuestion() {
        this.enterRecordedScreen('showGroupDistributionPreferenceQuestion');
        this.clearQuestionScreen();
        const fixedFood = this.getFixedFoodCounts();
        this.addQuestionObject(this.createStaticHumanAvatar(980, 115, 'Person C', 0.78, 13382451, fixedFood.personC));
        this.addQuestionObject(this.createStaticHumanAvatar(640, 115, 'Person B', 0.72, 3368652, fixedFood.personB));
        this.addQuestionObject(this.createStaticHumanAvatar(260, 115, 'Person A', 0.66, 3381606, fixedFood.personA));
        this.addQuestionObject(this.add.rectangle(640, 440, 1180, 390, 16777215).setStrokeStyle(4, 0));
        this.addQuestionObject(this.add.text(640, 320, 'In this scenario, should the group divide the food equally among all members, or should each member of the group keep the food they collected?', {
            fontSize: '27px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 },
            lineSpacing: 6
        }).setOrigin(0.5));
        this.addQuestionObject(this.add.text(640, 405, 'Choose only between these two options. No other arrangements are options.', {
            fontSize: '18px',
            color: '#555555',
            align: 'center',
            wordWrap: { width: 980 }
        }).setOrigin(0.5));
        const answers = this.getStableAnswerOrder('groupDistributionPreference', Phaser.Utils.Array.Shuffle([
            'The group should divide the food equally among all members.',
            'Each member of the group should keep the food they collected.'
        ]));
        this.createAnswerButton(640, 470, answers[0], 'groupDistributionPreference');
        this.createAnswerButton(640, 575, answers[1], 'groupDistributionPreference');

        ;
    }
    createStaticHumanAvatar(x, y, label, scale, shirtColor, foodAmount = 0, showBasket = true, labelOffsetY = 135 * scale) {
        const person = this.add.container(x, y);
        const skinColor = 11893327;
        const hairColor = 7028509;
        const pantsColor = 3355443;
        person.foodCount = 0;
        person.add(this.add.rectangle(0, -18 * scale, 10 * scale, 14 * scale, skinColor));
        person.add(this.add.circle(0, -43 * scale, 24 * scale, skinColor));
        person.add(this.add.ellipse(0, -64 * scale, 46 * scale, 18 * scale, hairColor));
        person.add(this.add.ellipse(-17 * scale, -55 * scale, 12 * scale, 18 * scale, hairColor));
        person.add(this.add.ellipse(17 * scale, -55 * scale, 12 * scale, 18 * scale, hairColor));
        person.add(this.add.circle(-8 * scale, -43 * scale, 2.7 * scale, 0));
        person.add(this.add.circle(8 * scale, -43 * scale, 2.7 * scale, 0));
        person.add(this.add.rectangle(0, -35 * scale, 3 * scale, 9 * scale, 10181678));
        person.add(this.add.rectangle(0, -27 * scale, 12 * scale, 2 * scale, 0));
        person.add(this.add.rectangle(0, 8 * scale, 46 * scale, 64 * scale, shirtColor));
        person.add(this.add.rectangle(-32 * scale, 10 * scale, 10 * scale, 52 * scale, skinColor));
        person.add(this.add.rectangle(32 * scale, 10 * scale, 10 * scale, 52 * scale, skinColor));
        if (showBasket) {
            person.add(this.createBasket(39 * scale, 31 * scale, scale));
            for (let i = 0; i < foodAmount; i += 1) {
                person.foodCount += 1;
                const position = person.foodCount - 1;
                const appleX = 39 * scale + this.getBasketFoodOffset(position, scale).x;
                const appleY = 31 * scale + this.getBasketFoodOffset(position, scale).y;
                person.add(this.createFoodFruit(appleX, appleY, scale));
            }
        }
        person.add(this.add.rectangle(-12 * scale, 71 * scale, 14 * scale, 48 * scale, pantsColor));
        person.add(this.add.rectangle(12 * scale, 71 * scale, 14 * scale, 48 * scale, pantsColor));
        person.add(this.add.text(0, labelOffsetY, label, {
            fontSize: this.phonePortrait ? '32px' : '26px',
            color: '#000000'
        }).setOrigin(0.5));
        if (showBasket) {
            const marker = this.createBasketThresholdMarker(x + 39 * scale, y + 31 * scale, scale).setDepth(21);
            if (this.phonePortrait) {
                marker.setPosition(this.portraitX(x) + 39 * scale, this.portraitY(y) + 31 * scale + this.getBasketFoodOffset(7, scale).y - 4 * scale);
                marker._portraitPositioned = true;
            }
            this.addQuestionObject(marker);
        }
        return person;
    }
    showPartialRedistributionTask() {
        this.enterRecordedScreen('showPartialRedistributionTask');
        this.clearQuestionScreen();
        const fixedFood = this.getFixedFoodCounts();
        const roleLabels = [
            'Person C',
            'Person B',
            'Person A'
        ];
        const people = [
            {
                label: 'Person C',
                x: 1020,
                scale: 1.05,
                color: 13382451,
                foodAmount: fixedFood.personC
            },
            {
                label: 'Person B',
                x: 640,
                scale: 1,
                color: 3368652,
                foodAmount: fixedFood.personB
            },
            {
                label: 'Person A',
                x: 260,
                scale: 0.9,
                color: 3381606,
                foodAmount: fixedFood.personA
            }
        ];
        this.partialRedistributionCounts = {
            'Person C': fixedFood.personC,
            'Person B': fixedFood.personB,
            'Person A': fixedFood.personA
        };
        this.partialRedistributionFoods = [];
        this.partialRedistributionFoodsByPerson = {
            'Person C': [],
            'Person B': [],
            'Person A': []
        };
        this.partialRedistributionCompleted = false;
        this.partialRedistributionNextShown = false;
        this.partialRedistributionInstructionText = this.add.text(640, 65, 'Click the button below to see what happens when people with more than 8 pieces share some of their food.', {
            fontSize: '26px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 1050 }
        }).setOrigin(0.5);
        this.addQuestionObject(this.partialRedistributionInstructionText);
        const baselineY = 390;
        this.partialRedistributionBaselineY = baselineY;
        const basketPositions = {
            'Person C': {
                x: (this.phonePortrait ? this.portraitX(1020) : 1020) + 39 * 1.05,
                y: (this.phonePortrait ? this.portraitY(baselineY) : baselineY) + 31 * 1.05,
                scale: 1.05
            },
            'Person B': {
                x: (this.phonePortrait ? this.portraitX(640) : 640) + 39,
                y: (this.phonePortrait ? this.portraitY(baselineY) : baselineY) + 31,
                scale: 1
            },
            'Person A': {
                x: (this.phonePortrait ? this.portraitX(260) : 260) + 39 * 0.9,
                y: (this.phonePortrait ? this.portraitY(baselineY) : baselineY) + 31 * 0.9,
                scale: 0.9
            }
        };
        const placeFood = (food, personLabel, pilePosition) => {
            const basket = basketPositions[personLabel];
            food.x = basket.x + this.getBasketFoodOffset(pilePosition, basket.scale).x;
            food.y = basket.y + this.getBasketFoodOffset(pilePosition, basket.scale).y;
            food.setDepth(20);
        };
        people.forEach(person => {
            this.addQuestionObject(this.createStaticHumanAvatar(person.x, baselineY, person.label, person.scale, person.color, 0));
            for (let i = 0; i < person.foodAmount; i += 1) {
                const food = this.createFoodFruit(0, 0);
                food._portraitPositioned = this.phonePortrait;
                food.assignedPerson = person.label;
                placeFood(food, person.label, i);
                this.partialRedistributionFoods.push(food);
                this.partialRedistributionFoodsByPerson[person.label].push(food);
                this.addQuestionObject(food);
            }
        });
        this.createSelfInterestActionButton(105, 675, 150, 'Reset', () => {
            this.showPartialRedistributionTask();
        }, 14540253, '#000000');
        const redistributionButton = this.add.rectangle(640, 675, 560, 64, 0);
        redistributionButton.setStrokeStyle(3, 0);
        redistributionButton.setInteractive({ useHandCursor: true });
        redistributionButton.setDepth(1000);
        const redistributionButtonText = this.add.text(640, 675, 'Redistribute to meet survival needs', {
            fontSize: this.phonePortrait ? '25px' : '20px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: this.phonePortrait ? 520 : 560 }
        }).setOrigin(0.5);
        redistributionButtonText.setDepth(1001);
        this.addQuestionObject(redistributionButton);
        this.addQuestionObject(redistributionButtonText);
        redistributionButton.on('pointerdown', () => {
            if (this.partialRedistributionCompleted) {
                return;
            }
            const targetAllocation = this.buildSurplusOnlyPartialAllocation();
            const transferableFood = [];
            roleLabels.forEach((personLabel, index) => {
                const personFood = this.partialRedistributionFoodsByPerson[personLabel];
                while (personFood.length > targetAllocation[index]) {
                    transferableFood.push(personFood.pop());
                }
            });
            roleLabels.forEach((personLabel, index) => {
                const personFood = this.partialRedistributionFoodsByPerson[personLabel];
                while (personFood.length < targetAllocation[index]) {
                    const transferredFood = transferableFood.shift();
                    transferredFood.assignedPerson = personLabel;
                    personFood.push(transferredFood);
                }
            });
            roleLabels.forEach(personLabel => {
                this.partialRedistributionFoodsByPerson[personLabel].forEach((food, pilePosition) => {
                    food.assignedPerson = personLabel;
                    placeFood(food, personLabel, pilePosition);
                });
            });
            this.partialRedistributionCounts = {
                'Person C': targetAllocation[0],
                'Person B': targetAllocation[1],
                'Person A': targetAllocation[2]
            };
            this.partialRedistributionCompleted = true;
            this.gameData.partialRedistributionShortcutUsed = true;
            redistributionButton.disableInteractive();
            redistributionButton.setVisible(false);
            redistributionButtonText.setVisible(false);
            this.partialRedistributionInstructionText.setText('Food above the survival threshold has been redistributed. \n \n The greatest possible number of people now have at least 8 pieces.');
            if (!this.partialRedistributionNextShown) {
                this.partialRedistributionNextShown = true;
                this.createNextButton(640, 675, 'Next', () => {
                    this.gameData.partialRedistributionFinal.personC = this.partialRedistributionCounts['Person C'];
                    this.gameData.partialRedistributionFinal.personB = this.partialRedistributionCounts['Person B'];
                    this.gameData.partialRedistributionFinal.personA = this.partialRedistributionCounts['Person A'];
                    this.gameData.partialRedistributionSurvivors = Object.values(this.partialRedistributionCounts).filter(count => count >= 8).length;
                    this.showRedistributionGroupInterestQuestion('partial');
                });
            }
        });

        ;
    }
    showPartialRedistributionPreferenceQuestion() {
        this.enterRecordedScreen('showPartialRedistributionPreferenceQuestion');
        this.clearQuestionScreen();
        const fixedFood = this.getFixedFoodCounts();
        this.addQuestionObject(this.createStaticHumanAvatar(980, 125, 'Person C', 0.78, 13382451, fixedFood.personC));
        this.addQuestionObject(this.createStaticHumanAvatar(640, 125, 'Person B', 0.72, 3368652, fixedFood.personB));
        this.addQuestionObject(this.createStaticHumanAvatar(260, 125, 'Person A', 0.66, 3381606, fixedFood.personA));
        this.addQuestionObject(this.add.rectangle(640, 455, 1080, 300, 16777215).setStrokeStyle(4, 0));
        this.addQuestionObject(this.add.text(640, 350, 'How should the group distribute the food?', {
            fontSize: '28px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 },
            lineSpacing: 8
        }).setOrigin(0.5));
        const answers = this.getStableAnswerOrder('partialRedistributionPreference', Phaser.Utils.Array.Shuffle([
            'Redistribute food so as many people as possible get at least 8 pieces.',
            'Let each person keep the food they collected.'
        ]));
        this.createAnswerButton(640, 455, answers[0], 'partialRedistributionPreference');
        this.createAnswerButton(640, 545, answers[1], 'partialRedistributionPreference');

        ;
    }
    showPersonalRedistributionQuestion() {
        this.enterRecordedScreen('showPersonalRedistributionQuestion');
        this.clearQuestionScreen();
        this.gameData.personalRedistributionSelected = {
            noRedistribution: false,
            equalRedistribution: false,
            partialRedistribution: false
        };
        this.personalRedistributionNextShown = false;
        this.personalRedistributionChecks = {};
        this.addQuestionObject(this.add.rectangle(640, 360, 1120, 520, 16777215).setStrokeStyle(4, 0));
        this.addQuestionObject(this.add.text(640, 150, 'Which approaches do you most support? Select all that apply.', {
            fontSize: '27px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 },
            lineSpacing: 6
        }).setOrigin(0.5));
        const options = Phaser.Utils.Array.Shuffle([
            {
                label: 'Each member of the group should keep the food they collected.',
                key: 'noRedistribution'
            },
            {
                label: 'The group should divide the food equally among all members.',
                key: 'equalRedistribution'
            },
            {
                label: 'The group should redistribute the food so that the greatest possible number of people receive at least 8 pieces.',
                key: 'partialRedistribution'
            }
        ]);
        options.forEach((option, index) => {
            this.createPersonalRedistributionCheckboxButton(640, 290 + index * 105, option.label, option.key);
        });

        ;
    }
    createPersonalRedistributionCheckboxButton(centerX, centerY, label, key) {
        this.recordDisplayedAnswer('personalRedistributionSelected', key, label);
        const box = this.add.rectangle(centerX - 420, centerY, 34, 34, 16777215);
        box.setStrokeStyle(3, 0);
        box.setInteractive({ useHandCursor: true });
        const check = this.add.text(centerX - 420, centerY, '\u2713', {
            fontSize: '25px',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        check.setVisible(false);
        this.personalRedistributionChecks[key] = check;
        const text = this.add.text(centerX - 375, centerY, label, {
            fontSize: '23px',
            color: '#000000',
            wordWrap: { width: 780 }
        }).setOrigin(0, 0.5);
        text.setInteractive({ useHandCursor: true });
        const toggle = () => {
            this.gameData.personalRedistributionSelected[key] = !this.gameData.personalRedistributionSelected[key];
            Object.entries(this.personalRedistributionChecks).forEach(([k, mark]) => mark.setVisible(this.gameData.personalRedistributionSelected[k]));
            const anySelected = this.gameData.personalRedistributionSelected.noRedistribution || this.gameData.personalRedistributionSelected.equalRedistribution || this.gameData.personalRedistributionSelected.partialRedistribution;
            if (anySelected) {
                if (!this.personalRedistributionNextShown) {
                    this.personalRedistributionNextShown = true;
                    this.createNextButton(640, 675, 'Next', () => {
                        this.showEconomicPrinciple();
                    });
                }
            } else {
                if (this.currentNextButton) {
                    this.currentNextButton.destroy();
                    this.currentNextButton = null;
                }
                if (this.currentNextText) {
                    this.currentNextText.destroy();
                    this.currentNextText = null;
                }
                this.personalRedistributionNextShown = false;
            }
        };
        box.on('pointerdown', toggle);
        text.on('pointerdown', toggle);
        this.addQuestionObject(box);
        this.addQuestionObject(check);
        this.addQuestionObject(text);
    }
    showSurvivalRedistributionQuestion() {
        this.enterRecordedScreen('showSurvivalRedistributionQuestion');
        this.clearQuestionScreen();
        this.gameData.survivalRedistributionSelected = {
            noRedistribution: false,
            equalRedistribution: false,
            partialRedistribution: false
        };
        /*
     * Preserve compatibility with existing
     * Google Sheets columns and scripts.
     */
        this.gameData.redistributionRulesSelected = this.gameData.survivalRedistributionSelected;
        this.survivalRedistributionNextShown = false;
        this.addQuestionObject(this.add.rectangle(640, 360, 1120, 520, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(640, 160, 'Which approaches would allow the most people to survive? Select all that apply.', {
            fontSize: '27px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 },
            lineSpacing: 6
        }).setOrigin(0.5));
        const options = Phaser.Utils.Array.Shuffle([
            {
                label: 'Each member of the group should keep the food they collected.',
                key: 'noRedistribution'
            },
            {
                label: 'The group should divide the food equally among all members.',
                key: 'equalRedistribution'
            },
            {
                label: 'The group should redistribute the food so that the greatest possible number of people receive at least 8 pieces.',
                key: 'partialRedistribution'
            }
        ]);
        options.forEach((option, index) => {
            this.createCheckboxButton(640, 300 + index * 100, option.label, option.key);
        });

        ;
    }
    createCheckboxButton(centerX, centerY, label, key) {
        this.recordDisplayedAnswer('survivalRedistributionSelected', key, label);
        const box = this.add.rectangle(centerX - 420, centerY, 34, 34, 16777215);
        box.setStrokeStyle(3, 0);
        box.setInteractive({ useHandCursor: true });
        const check = this.add.text(centerX - 420, centerY, '\u2713', {
            fontSize: '25px',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        check.setVisible(false);
        const text = this.add.text(centerX - 375, centerY, label, {
            fontSize: '23px',
            color: '#000000',
            wordWrap: { width: 780 }
        }).setOrigin(0, 0.5);
        text.setInteractive({ useHandCursor: true });
        const toggle = () => {
            this.gameData.survivalRedistributionSelected[key] = !this.gameData.survivalRedistributionSelected[key];
            this.gameData.redistributionRulesSelected = this.gameData.survivalRedistributionSelected;
            check.setVisible(this.gameData.survivalRedistributionSelected[key]);
            const anySelected = this.gameData.survivalRedistributionSelected.noRedistribution || this.gameData.survivalRedistributionSelected.equalRedistribution || this.gameData.survivalRedistributionSelected.partialRedistribution;
            if (anySelected) {
                if (!this.survivalRedistributionNextShown) {
                    this.survivalRedistributionNextShown = true;
                    this.createNextButton(640, 675, 'Next', () => {
                        this.showPersonalRedistributionQuestion();
                    });
                }
            } else {
                if (this.currentNextButton) {
                    this.currentNextButton.destroy();
                    this.currentNextButton = null;
                }
                if (this.currentNextText) {
                    this.currentNextText.destroy();
                    this.currentNextText = null;
                }
                this.survivalRedistributionNextShown = false;
            }
        };
        box.on('pointerdown', toggle);
        text.on('pointerdown', toggle);
        this.addQuestionObject(box);
        this.addQuestionObject(check);
        this.addQuestionObject(text);
    }
    showSocialContractQuestion() {
        this.enterRecordedScreen('showSocialContractQuestion');
        this.clearQuestionScreen();
        this.addQuestionObject(this.add.rectangle(640, 360, 1120, 500, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(640, 235, 'Should the group adopt a rule that guarantees each person enough food to survive, or not?', {
            fontSize: '27px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 },
            lineSpacing: 6
        }).setOrigin(0.5));
        const answers = this.getStableAnswerOrder('socialContractGuarantee', Phaser.Utils.Array.Shuffle([
            'The group should adopt a rule that guarantees each person enough food to survive.',
            'The group should not adopt a rule that guarantees each person enough food to survive.'
        ]));
        this.createAnswerButton(640, 410, answers[0], 'socialContractGuarantee');
        this.createAnswerButton(640, 535, answers[1], 'socialContractGuarantee');

        ;
    }
    showEconomicPrinciple(index = 0) {
        const personDQuestions = ['personDShareChoice', 'personDEmpathyChoice'];
        if (!this.gameData.economicPrincipleOrder) {
            const principleBlocks = Phaser.Utils.Array.Shuffle([
                'personalVsGroupResponsibility', 'fairRuleChoice', 'foodPriorityChoice',
                'workBreakChoice', 'floodPreparationChoice', 'personDBlock',
                'cooperationCompetitionChoice'
            ]);
            const personDOrder = Phaser.Utils.Array.Shuffle([...personDQuestions]);
            this.gameData.economicPrincipleOrder = principleBlocks.flatMap(key =>
                key === 'personDBlock' ? personDOrder : [key]
            );
        }
        this.economicPrincipleIndex = index;
        const screens = {
            personalVsGroupResponsibility: () => this.showPersonalVsGroupResponsibilityQuestion(),
            fairRuleChoice: () => this.showFairRuleQuestion(),
            foodPriorityChoice: () => this.showFoodPriorityQuestion(),
            workBreakChoice: () => this.showWorkBreakQuestion(),
            floodPreparationChoice: () => this.showFloodRiskInstructionScreen(),
            personDShareChoice: () => this.showPersonDShareQuestion(),
            personDEmpathyChoice: () => this.showPersonDEmpathyQuestion(),
            cooperationCompetitionChoice: () => this.showCooperationCompetitionInstructionScreen()
        };
        const key = this.gameData.economicPrincipleOrder[index];
        if (!key) { this.showSelfInterestAssignmentScreen(); return; }
        if (personDQuestions.includes(key) &&
            !personDQuestions.includes(this.gameData.economicPrincipleOrder[index - 1])) {
            this.showPersonDInstructionScreen(screens[key]);
        } else {
            screens[key]();
        }
    }
    showPersonalVsGroupResponsibilityQuestion() {
        this.enterRecordedScreen('showPersonalVsGroupResponsibilityQuestion');
        this.clearQuestionScreen();
        this.addQuestionObject(this.add.rectangle(640, 360, 1120, 500, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(640, 230, 'In this situation, which should receive greater priority: personal responsibility or shared responsibility for meeting food needs?', {
            fontSize: '25px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 },
            lineSpacing: 6
        }).setOrigin(0.5));
        const answers = this.getStableAnswerOrder('personalVsGroupResponsibility', Phaser.Utils.Array.Shuffle([
            'The group sharing responsibility for meeting everyone’s food needs.',
            'Each person taking responsibility for meeting their own food needs.'
        ]));
        this.createAnswerButton(640, 430, answers[0], 'personalVsGroupResponsibility');
        this.createAnswerButton(640, 550, answers[1], 'personalVsGroupResponsibility');

        ;
    }
    showFairRuleQuestion() {
        this.enterRecordedScreen('showFairRuleQuestion');
        this.clearQuestionScreen();
        this.addQuestionObject(this.add.rectangle(640, 360, 1120, 500, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(640, 230, 'Would it be fair for the group to have a rule requiring people who collected more food than they need for survival to share some with people who collected less than they need?', {
            fontSize: '29px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 },
            lineSpacing: 6
        }).setOrigin(0.5));
        const answers = this.getStableAnswerOrder('fairRuleChoice', Phaser.Utils.Array.Shuffle([
            'Yes, requiring this transfer would be fair.',
            'No, requiring this transfer would not be fair.'
        ]));
        this.createAnswerButton(640, 410, answers[0], 'fairRuleChoice');
        this.createAnswerButton(640, 540, answers[1], 'fairRuleChoice');

        ;
    }
    showFoodPriorityQuestion() {
        this.enterRecordedScreen('showFoodPriorityQuestion');
        this.clearQuestionScreen();
        const fixedFood = this.getFixedFoodCounts();
        this.addQuestionObject(this.createStaticHumanAvatar(1000, 90, 'Person C', 0.82, 13382451, fixedFood.personC));
        this.addQuestionObject(this.createStaticHumanAvatar(640, 90, 'Person B', 0.74, 3368652, fixedFood.personB));
        this.addQuestionObject(this.createStaticHumanAvatar(280, 90, 'Person A', 0.66, 3381606, fixedFood.personA));
        this.addQuestionObject(this.add.rectangle(640, 435, 1120, this.phonePortrait ? 470 : 390, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(640, 310, 'Person A usually collects the least food and needs help to survive. Person C usually collects the most food and can contribute more to feeding the group. When deciding whom to give food to, which person should the group prioritize?', {
            fontSize: '24px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 },
            lineSpacing: 6
        }).setOrigin(0.5));
        const answers = this.getStableAnswerOrder('foodPriorityChoice', Phaser.Utils.Array.Shuffle([
            'Person A',
            'Person C'
        ]));
        this.createAnswerButton(640, 445, answers[0], 'foodPriorityChoice');
        this.createAnswerButton(640, 545, answers[1], 'foodPriorityChoice');

        ;
    }
    showWorkBreakQuestion() {
        this.enterRecordedScreen('showWorkBreakQuestion');
        this.clearQuestionScreen();
        this.addQuestionObject(this.createTiredFace(640, 145, 1.6));
        this.addQuestionObject(this.add.rectangle(640, 465, 1120, this.phonePortrait ? 400 : 360, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(640, 365, 'Hunting and gathering food is hard work. If a person is sick or exhausted and needs a few days to recover, should they be able to stop collecting food and still receive enough food to survive?', {
            fontSize: '27px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 },
            lineSpacing: 6
        }).setOrigin(0.5));
        const answers = this.getStableAnswerOrder('workBreakChoice', Phaser.Utils.Array.Shuffle([
            'Yes, let the person rest for a few days and still give them enough food to survive.',
            'No, the person should keep collecting food rather than receive food while resting.'
        ]));
        this.createAnswerButton(640, 490, answers[0], 'workBreakChoice');
        this.createAnswerButton(640, 580, answers[1], 'workBreakChoice');

        ;
    }
    createTiredHumanAvatar(x, y, label, scale, shirtColor) {
        const person = this.add.container(x, y);
        const skinColor = 11893327;
        const hairColor = 7028509;
        const pantsColor = 3355443;
        const sweatColor = 4891615;
        person.add(this.add.rectangle(0, -18 * scale, 10 * scale, 14 * scale, skinColor));
        person.add(this.add.circle(0, -43 * scale, 24 * scale, skinColor));
        person.add(this.add.ellipse(0, -64 * scale, 46 * scale, 18 * scale, hairColor));
        person.add(this.add.ellipse(-17 * scale, -55 * scale, 12 * scale, 18 * scale, hairColor));
        person.add(this.add.ellipse(17 * scale, -55 * scale, 12 * scale, 18 * scale, hairColor));
        person.add(this.add.rectangle(-8 * scale, -43 * scale, 12 * scale, 2 * scale, 0));
        person.add(this.add.rectangle(8 * scale, -43 * scale, 12 * scale, 2 * scale, 0));
        person.add(this.add.rectangle(0, -35 * scale, 3 * scale, 9 * scale, 10181678));
        person.add(this.add.arc(0, -24 * scale, 9 * scale, 200, 340, false, 0));
        person.add(this.add.circle(-9 * scale, -50 * scale, 3.2 * scale, sweatColor));
        person.add(this.add.circle(7 * scale, -59 * scale, 3 * scale, sweatColor));
        person.add(this.add.circle(-22 * scale, -38 * scale, 3.5 * scale, sweatColor));
        person.add(this.add.circle(18 * scale, -45 * scale, 2.8 * scale, sweatColor));
        person.add(this.add.rectangle(0, 8 * scale, 46 * scale, 64 * scale, shirtColor));
        person.add(this.add.rectangle(-34 * scale, 15 * scale, 10 * scale, 52 * scale, skinColor).setAngle(18));
        person.add(this.add.rectangle(34 * scale, 15 * scale, 10 * scale, 52 * scale, skinColor).setAngle(-18));
        person.add(this.add.rectangle(-12 * scale, 71 * scale, 14 * scale, 48 * scale, pantsColor));
        person.add(this.add.rectangle(12 * scale, 71 * scale, 14 * scale, 48 * scale, pantsColor));
        person.add(this.add.text(0, 135 * scale, label, {
            fontSize: '26px',
            color: '#000000'
        }).setOrigin(0.5));
        return person;
    }
    createTiredFace(x, y, scale) {
        const face = this.add.container(x, y);
        const skinColor = 11893327;
        const hairColor = 7028509;
        const sweatColor = 4891615;
        face.add(this.add.circle(0, 0, 48 * scale, skinColor));
        face.add(this.add.ellipse(0, -45 * scale, 90 * scale, 30 * scale, hairColor));
        face.add(this.add.ellipse(-34 * scale, -28 * scale, 22 * scale, 38 * scale, hairColor));
        face.add(this.add.ellipse(34 * scale, -28 * scale, 22 * scale, 38 * scale, hairColor));
        face.add(this.add.rectangle(-18 * scale, -5 * scale, 20 * scale, 3 * scale, 0));
        face.add(this.add.rectangle(18 * scale, -5 * scale, 20 * scale, 3 * scale, 0));
        face.add(this.add.rectangle(0, 10 * scale, 5 * scale, 16 * scale, 10181678));
        face.add(this.add.arc(0, 35 * scale, 18 * scale, 200, 340, false, 0));
        face.add(this.add.circle(-15 * scale, -30 * scale, 6 * scale, sweatColor));
        face.add(this.add.circle(-40 * scale, -6 * scale, 6 * scale, sweatColor));
        face.add(this.add.circle(-46 * scale, 10 * scale, 4.5 * scale, sweatColor));
        face.add(this.add.circle(40 * scale, -9 * scale, 6 * scale, sweatColor));
        face.add(this.add.circle(46 * scale, 20 * scale, 4.5 * scale, sweatColor));
        return face;
    }
    showFloodRiskInstructionScreen() {
        this.enterRecordedScreen('showFloodRiskInstructionScreen');
        this.clearQuestionScreen();
        if (!this.floodTaskSides) {
            const sticksOnLeft = Phaser.Math.Between(0, 1) === 0;
            this.floodTaskSides = {
                sticksX: sticksOnLeft ? 230 : 1050,
                treeX: sticksOnLeft ? 1050 : 230
            };
        }
        this.addQuestionObject(this.add.rectangle(640, 360, 1120, 560, 16777215)).setStrokeStyle(4, 0);
        this.drawStormCloud(1035, 120, 0.55);
        this.addQuestionObject(this.createStaticHumanAvatar(470, 345, '', 0.95, 13382451, 0, false));
        this.addQuestionObject(this.createStaticHumanAvatar(640, 345, '', 0.88, 3368652, 0, false));
        this.addQuestionObject(this.createStaticHumanAvatar(810, 345, '', 0.8, 3381606, 0, false));
        this.addQuestionObject(this.add.text(640, 575, 'It is highly likely the location will flood when the rainy season arrives in a few weeks.', {
            fontSize: '27px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 },
            lineSpacing: 6
        }).setOrigin(0.5));
        this.createNextButton(640, 675, 'Next', () => {
            this.showFloodPreparationQuestion();
        });
    }
    drawStormCloud(x, y, scale = 1) {
        const cloudColor = 7305088;
        const darkCloudColor = 5265504;
        const rainColor = 4161471;
        this.addQuestionObject(this.add.circle(x - 55 * scale, y + 5 * scale, 34 * scale, cloudColor));
        this.addQuestionObject(this.add.circle(x - 20 * scale, y - 15 * scale, 45 * scale, cloudColor));
        this.addQuestionObject(this.add.circle(x + 30 * scale, y - 10 * scale, 40 * scale, darkCloudColor));
        this.addQuestionObject(this.add.circle(x + 70 * scale, y + 8 * scale, 30 * scale, cloudColor));
        this.addQuestionObject(this.add.rectangle(x + 8 * scale, y + 18 * scale, 150 * scale, 42 * scale, cloudColor));
        for (let i = 0; i < 6; i += 1) {
            const rain = this.add.line(x - 65 * scale + i * 26 * scale, y + 65 * scale, 0, 0, -8 * scale, 28 * scale, rainColor);
            rain.setLineWidth(3 * scale);
            this.addQuestionObject(rain);
        }
    }
    drawStickPile(x, y) {
        const stickColor = 9132587;
        for (let i = 0; i < 8; i += 1) {
            const stick = this.add.rectangle(x + Phaser.Math.Between(-35, 35), y + Phaser.Math.Between(-20, 20), 95, 9, stickColor);
            stick.setAngle(Phaser.Math.Between(-35, 35));
            stick.setStrokeStyle(1, 4860434);
            this.addQuestionObject(stick);
        }
    }
    drawFloodTaskTree(x, y) {
        this.addQuestionObject(this.add.rectangle(x, y + 75, 36, 130, 10183465));
        this.addQuestionObject(this.add.circle(x, y - 40, 78, 3112242));
        this.addQuestionObject(this.add.circle(x - 55, y, 58, 4037186));
        this.addQuestionObject(this.add.circle(x + 55, y, 58, 4037186));
        this.addQuestionObject(this.add.circle(x, y + 35, 64, 3116856));
    }
    showFloodPreparationQuestion() {
        this.enterRecordedScreen('showFloodPreparationQuestion');
        this.clearQuestionScreen();
        this.addQuestionObject(this.add.rectangle(640, 360, 1120, 560, 16777215)).setStrokeStyle(4, 0);
        this.drawFloodTaskTree(this.floodTaskSides.treeX, 165);
        this.drawStickPile(this.floodTaskSides.sticksX, 275);
        this.addQuestionObject(this.createStaticHumanAvatar(470, 275, '', 0.82, 13382451, 0, false));
        this.addQuestionObject(this.createStaticHumanAvatar(640, 275, '', 0.76, 3368652, 0, false));
        this.addQuestionObject(this.createStaticHumanAvatar(810, 275, '', 0.7, 3381606, 0, false));
        this.addQuestionObject(this.add.text(640, 400, 'Should the group spend the rest of the day looking for more food to eat or preparing the location to withstand flooding in a few weeks?', {
            fontSize: '27px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 },
            lineSpacing: 6
        }).setOrigin(0.5));
        const answers = this.getStableAnswerOrder('floodPreparationChoice', Phaser.Utils.Array.Shuffle([
            'The group should spend the rest of the day looking for more food to eat.',
            'The group should spend the rest of the day preparing the location to withstand flooding in a few weeks.'
        ]));
        this.createAnswerButton(640, 500, answers[0], 'floodPreparationChoice');
        this.createAnswerButton(640, 580, answers[1], 'floodPreparationChoice');

        ;
    }
    showPersonDInstructionScreen(nextQuestion = () => this.showPersonDShareQuestion()) {
        this.enterRecordedScreen('showPersonDInstructionScreen', () => this.showPersonDInstructionScreen(nextQuestion));
        this.clearQuestionScreen();
        this.addQuestionObject(this.add.rectangle(640, 360, 1120, 560, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(640, 165, 'A new person (Person D) wanders into the group\u2019s location and begs for food. The new person is peaceful and not threatening.', {
            fontSize: '27px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 },
            lineSpacing: 6
        }).setOrigin(0.5));
        this.addQuestionObject(this.createStaticHumanAvatar(535, 375, 'Person C', 0.78, 13382451, 0, false));
        this.addQuestionObject(this.createStaticHumanAvatar(395, 355, 'Person B', 0.72, 3368652, 0, false));
        this.drawSmallFire(395, 525, 0.75);
        this.addQuestionObject(this.createStaticHumanAvatar(240, 390, 'Person A', 0.66, 3381606, 0, false));
        this.addQuestionObject(this.createPersonDOutstretchedAvatar(1050, 355, 'Person D', 0.66, 9067076));
        this.createNextButton(640, 675, 'Next', () => {
            nextQuestion();
        });
    }
    showPersonDShareQuestion() {
        this.enterRecordedScreen('showPersonDShareQuestion');
        this.clearQuestionScreen();
        this.addQuestionObject(this.createPersonDOutstretchedAvatar(640, 125, 'Person D', 0.82, 9067076));
        this.addQuestionObject(this.add.rectangle(640, 425, 1120, 300, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(640, 325, 'Should the members of the group share their food with Person D or ask Person D to get food elsewhere?', {
            fontSize: '27px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 },
            lineSpacing: 6
        }).setOrigin(0.5));
        const answers = this.getStableAnswerOrder('personDShareChoice', Phaser.Utils.Array.Shuffle([
            'Members of the group should share their food with Person D.',
            'Members of the group should ask Person D to get food elsewhere.'
        ]));
        this.createAnswerButton(640, 435, answers[0], 'personDShareChoice');
        this.createAnswerButton(640, 525, answers[1], 'personDShareChoice');

        ;
    }
    createPersonDOutstretchedAvatar(x, y, label, scale, shirtColor) {
        const person = this.add.container(x, y);
        const skinColor = 11893327;
        const hairColor = 7028509;
        const pantsColor = 3355443;
        person.add(this.add.rectangle(0, -18 * scale, 10 * scale, 14 * scale, skinColor));
        person.add(this.add.circle(0, -43 * scale, 24 * scale, skinColor));
        person.add(this.add.ellipse(0, -64 * scale, 46 * scale, 18 * scale, hairColor));
        person.add(this.add.ellipse(-17 * scale, -55 * scale, 12 * scale, 18 * scale, hairColor));
        person.add(this.add.ellipse(17 * scale, -55 * scale, 12 * scale, 18 * scale, hairColor));
        person.add(this.add.circle(-14 * scale, -43 * scale, 2.7 * scale, 0));
        person.add(this.add.circle(-2 * scale, -43 * scale, 2.7 * scale, 0));
        person.add(this.add.rectangle(-6 * scale, -35 * scale, 3 * scale, 9 * scale, 10181678));
        person.add(this.add.arc(-6 * scale, -25 * scale, 9 * scale, 20, 160, false, 0));
        person.add(this.add.rectangle(0, 8 * scale, 42 * scale, 60 * scale, shirtColor));
        person.add(this.add.rectangle(-42 * scale, -2 * scale, 58 * scale, 9 * scale, skinColor).setAngle(8));
        person.add(this.add.rectangle(30 * scale, 13 * scale, 9 * scale, 48 * scale, skinColor).setAngle(-12));
        person.add(this.add.rectangle(-12 * scale, 71 * scale, 13 * scale, 48 * scale, pantsColor));
        person.add(this.add.rectangle(12 * scale, 71 * scale, 13 * scale, 48 * scale, pantsColor));
        person.add(this.add.text(0, 130 * scale, label, {
            fontSize: '24px',
            color: '#000000'
        }).setOrigin(0.5));
        return person;
    }
    drawSmallFire(x, y, scale = 1) {
        this.addQuestionObject(this.add.rectangle(x, y + 35 * scale, 120 * scale, 16 * scale, 9132587)).setAngle(8);
        this.addQuestionObject(this.add.rectangle(x, y + 35 * scale, 120 * scale, 16 * scale, 9132587)).setAngle(-8);
        this.addQuestionObject(this.add.triangle(x, y, 0, 55 * scale, 28 * scale, -28 * scale, 56 * scale, 55 * scale, 16742912));
        this.addQuestionObject(this.add.triangle(x, y + 8 * scale, 0, 38 * scale, 19 * scale, -20 * scale, 38 * scale, 38 * scale, 16765514));
    }
    showPersonDEmpathyQuestion() {
        this.enterRecordedScreen('showPersonDEmpathyQuestion');
        this.clearQuestionScreen();
        this.addQuestionObject(this.createPersonDOutstretchedAvatar(640, 125, 'Person D', 0.82, 9067076));
        this.addQuestionObject(this.add.rectangle(640, 450, 1120, 350, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(640, 325, 'When deciding whether to give Person D food, which should weigh more heavily?', {
            fontSize: '26px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 },
            lineSpacing: 6
        }).setOrigin(0.5));
        const answers = this.getStableAnswerOrder('personDEmpathyChoice', Phaser.Utils.Array.Shuffle([
            'Concern for Person D’s well-being.',
            'The food other group members would have to give up.'
        ]));
        this.createAnswerButton(640, 445, answers[0], 'personDEmpathyChoice');
        this.createAnswerButton(640, 540, answers[1], 'personDEmpathyChoice');

        ;
    }
    showCooperationCompetitionInstructionScreen() {
        this.enterRecordedScreen('showCooperationCompetitionInstructionScreen');
        this.clearQuestionScreen();
        this.addQuestionObject(this.add.rectangle(640, 360, 1120, 430, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(640, 345, 'Most people are cooperative in some situations and competitive in others.', {
            fontSize: '27px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 900 },
            lineSpacing: 6
        }).setOrigin(0.5));
        this.createNextButton(640, 605, 'Next', () => {
            this.showCooperationCompetitionQuestion();
        });
    }
    drawCooperationCompetitionPanel(x, y, cooperative) {
        const panel = this.add.rectangle(x, y, 500, 330, 16316664);
        panel.setStrokeStyle(3, 0);
        panel.setDepth(1);
        this.addQuestionObject(panel);
        if (cooperative) {
            this.addQuestionObject(this.createPanelAvatar(x - 85, y + 45, '', 0.72, 13382451, 'smile', 'right'));
            this.addQuestionObject(this.createPanelAvatar(x + 10, y + 45, '', 0.72, 3381606, 'smile', 'left'));
            this.addQuestionObject(this.createPanelAvatar(x + 135, y + 45, '', 0.72, 3368652, 'smile', 'down'));
            const handshake = this.add.circle(x - 35, y + 42, 5, 11893327);
            handshake.setDepth(20);
            this.addQuestionObject(handshake);
        } else {
            this.addQuestionObject(this.createPanelAvatar(x - 145, y + 45, '', 0.72, 3368652, 'scowl', 'down'));
            this.addQuestionObject(this.createPanelAvatar(x - 35, y + 45, '', 0.72, 13382451, 'scowl', 'right'));
            this.addQuestionObject(this.createPanelAvatar(x + 55, y + 45, '', 0.72, 3381606, 'scowl', 'left'));
            const food = this.add.circle(x + 10, y + 42, 5.5, 11674146);
            food.setStrokeStyle(1, 0);
            food.setDepth(20);
            this.addQuestionObject(food);
        }
    }
    createPanelAvatar(x, y, label, scale, shirtColor, expression, armPose) {
        const person = this.add.container(x, y);
        person.setDepth(10);
        const skinColor = 11893327;
        const hairColor = 7028509;
        const pantsColor = 3355443;
        person.add(this.add.rectangle(0, -18 * scale, 10 * scale, 14 * scale, skinColor));
        person.add(this.add.circle(0, -43 * scale, 24 * scale, skinColor));
        person.add(this.add.ellipse(0, -64 * scale, 46 * scale, 18 * scale, hairColor));
        person.add(this.add.ellipse(-17 * scale, -55 * scale, 12 * scale, 18 * scale, hairColor));
        person.add(this.add.ellipse(17 * scale, -55 * scale, 12 * scale, 18 * scale, hairColor));
        person.add(this.add.circle(-8 * scale, -43 * scale, 2.7 * scale, 0));
        person.add(this.add.circle(8 * scale, -43 * scale, 2.7 * scale, 0));
        person.add(this.add.rectangle(0, -35 * scale, 3 * scale, 9 * scale, 10181678));
        if (expression === 'scowl') {
            person.add(this.add.rectangle(-8 * scale, -53 * scale, 13 * scale, 2 * scale, 0).setAngle(18));
            person.add(this.add.rectangle(8 * scale, -53 * scale, 13 * scale, 2 * scale, 0).setAngle(-18));
            const mouth = this.add.graphics();
            mouth.lineStyle(2, 0);
            mouth.beginPath();
            mouth.arc(0, -18 * scale, 9 * scale, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340), true);
            mouth.strokePath();
            person.add(mouth);
        } else {
            const mouth = this.add.graphics();
            mouth.lineStyle(2, 0);
            mouth.beginPath();
            mouth.arc(0, -36 * scale, 10 * scale, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(160), false);
            mouth.strokePath();
            person.add(mouth);
        }
        person.add(this.add.rectangle(0, 8 * scale, 46 * scale, 64 * scale, shirtColor));
        if (armPose === 'right') {
            person.add(this.add.rectangle(-32 * scale, 10 * scale, 10 * scale, 52 * scale, skinColor));
            person.add(this.add.rectangle(38 * scale, -2 * scale, 58 * scale, 9 * scale, skinColor).setAngle(-7));
        } else if (armPose === 'left') {
            person.add(this.add.rectangle(32 * scale, 10 * scale, 10 * scale, 52 * scale, skinColor));
            person.add(this.add.rectangle(-38 * scale, -2 * scale, 58 * scale, 9 * scale, skinColor).setAngle(7));
        } else {
            person.add(this.add.rectangle(-32 * scale, 10 * scale, 10 * scale, 52 * scale, skinColor));
            person.add(this.add.rectangle(32 * scale, 10 * scale, 10 * scale, 52 * scale, skinColor));
        }
        person.add(this.add.rectangle(-12 * scale, 71 * scale, 14 * scale, 48 * scale, pantsColor));
        person.add(this.add.rectangle(12 * scale, 71 * scale, 14 * scale, 48 * scale, pantsColor));
        this.addQuestionObject(person);
        return person;
    }
    showCooperationCompetitionQuestion() {
        this.enterRecordedScreen('showCooperationCompetitionQuestion');
        this.clearQuestionScreen();
        const fixedFood = this.getFixedFoodCounts();
        this.addQuestionObject(this.createStaticHumanAvatar(1000, 115, 'Person C', 0.78, 13382451, fixedFood.personC));
        this.addQuestionObject(this.createStaticHumanAvatar(640, 115, 'Person B', 0.72, 3368652, fixedFood.personB));
        this.addQuestionObject(this.createStaticHumanAvatar(280, 115, 'Person A', 0.66, 3381606, fixedFood.personA));
        this.addQuestionObject(this.add.rectangle(640, 455, 1120, 360, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(640, 330, 'Do you think that the people in this group are probably more cooperative or competitive?', {
            fontSize: '28px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 },
            lineSpacing: 6
        }).setOrigin(0.5));
        const answers = this.getStableAnswerOrder('cooperationCompetitionChoice', Phaser.Utils.Array.Shuffle([
            'The people in this group are probably more competitive.',
            'The people in this group are probably more cooperative.'
        ]));
        this.createAnswerButton(640, 455, answers[0], 'cooperationCompetitionChoice');
        this.createAnswerButton(640, 560, answers[1], 'cooperationCompetitionChoice');

        ;
    }
    showSelfInterestAssignmentScreen() {
        this.gameData.respondentRole ||= this.assignSelfInterestPerson();
        this.gameData.selfInterestCondition = 'reveal';
        this.showRespondentRoleScreen();
    }
    showRespondentRoleScreen() {
        this.gameData.respondentRoleRevealed = true;
        const respondentRole = this.gameData.respondentRole;
        const fixedFood = this.getFixedFoodCounts();
        const respondentFood = {'Person C': fixedFood.personC, 'Person B': fixedFood.personB, 'Person A': fixedFood.personA}[respondentRole];
        this.showFoodPolicyTransition('Consider your food', `Start again with Persons A, B, and C.\n\nFor this task, imagine you are ${respondentRole}. You have ${respondentFood} pieces of food.`, () => this.startSelfInterestAllocation(), 'Task 4', {
            before: 'Start again with Persons A, B, and C.',
            focus: `For this task, imagine you are ${respondentRole}.`,
            after: `You have ${respondentFood} pieces of food.`
        });
    }
    drawSelfInterestStartingRoles(highlightedRole) {
        this.enterRecordedScreen(highlightedRole ? 'self_interest_role_reveal' : 'self_interest_neutral_intro');
        const fixedFood = this.getFixedFoodCounts();
        const roles = [
            {
                label: 'Person C',
                key: 'personC',
                x: 1020,
                scale: 0.82,
                shirtColor: 13382451
            },
            {
                label: 'Person B',
                key: 'personB',
                x: 640,
                scale: 0.76,
                shirtColor: 3368652
            },
            {
                label: 'Person A',
                key: 'personA',
                x: 260,
                scale: 0.7,
                shirtColor: 3381606
            }
        ];
        roles.forEach(role => {
            if (role.label === highlightedRole) {
                const outline = this.add.rectangle(role.x, 405, 270, 345, 16777215, 0);
                outline.setStrokeStyle(6, 1797946);
                this.addQuestionObject(outline);
            }
            this.addQuestionObject(this.createStaticHumanAvatar(role.x, 350, role.label, role.scale, role.shirtColor, fixedFood[role.key]));
        });
    }
    startSelfInterestAllocation(stage = 'final') {
        this.allocationStage = stage;
        const draft = stage === 'final' ? this.selfInterestDraft : null;
        this.allocationStartedAt = draft?.startedAt || Date.now();
        this.selfInterestMoveSize = draft?.moveSize || 1;
        const fixedFood = this.getFixedFoodCounts();
        this.selfInterestCounts = draft ? { ...draft.counts } : {
            'Person C': fixedFood.personC,
            'Person B': fixedFood.personB,
            'Person A': fixedFood.personA
        };
        this.selfInterestEqualApplied = draft?.equalApplied || false;
        this.selfInterestPartialApplied = draft?.partialApplied || false;
        this.selfInterestAllocationSource = draft?.source || 'starting_distribution';
        this.showSelfInterestAllocationTask();
    }
    showSelfInterestAllocationTask() {
        const allocationStage = this.allocationStage;
        this.enterRecordedScreen(allocationStage === 'initial' ? 'free_allocation' : 'self_interest_allocation',
            () => this.startSelfInterestAllocation(allocationStage));
        this.clearQuestionScreen();
        this.clearGameObjects();
        const fixedFood = this.getFixedFoodCounts();
        const isInitial = this.allocationStage === 'initial';
        const revealRole = !isInitial && this.gameData.respondentRoleRevealed ? this.gameData.respondentRole : null;
        this.addQuestionObject(this.add.rectangle(640, 360, 1240, 700, 16777215).setStrokeStyle(3, 0));
        this.addQuestionObject(this.add.text(640, 24, 'Arrange the food as you think best.', {
            fontSize: '29px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 1150 }
        }).setOrigin(0.5, 0));
        this.addQuestionObject(this.add.text(640, 70, 'Each person needs 8 pieces to survive.', {
            fontSize: '20px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 1120 }
        }).setOrigin(0.5, 0));
        const statusLine = revealRole ? `Imagine you are ${ revealRole } (outlined in green).` : '';
        this.addQuestionObject(this.add.text(640, 125, statusLine, {
            fontSize: '24px',
            color: revealRole ? '#1b6f3a' : '#555555',
            align: 'center',
            wordWrap: { width: 1060 }
        }).setOrigin(0.5, 0));
        const roles = [
            {
                label: 'Person C',
                x: 1020,
                scale: 0.9,
                shirtColor: 13382451
            },
            {
                label: 'Person B',
                x: 640,
                scale: 0.84,
                shirtColor: 3368652
            },
            {
                label: 'Person A',
                x: 260,
                scale: 0.78,
                shirtColor: 3381606
            }
        ];
        this.selfInterestBaselineY = 330;
        this.selfInterestDropZones = {};
        this.selectedSelfInterestFood = null;
        this.input.dragDistanceThreshold = 6;
        this.selfInterestCountTexts = {};
        roles.forEach(role => {
            if (role.label === revealRole) {
                const outline = this.add.rectangle(role.x, 350, 270, 390, 16777215, 0);
                outline.setStrokeStyle(6, 1797946);
                this.addQuestionObject(outline);
            }
            this.addQuestionObject(this.createStaticHumanAvatar(role.x, this.selfInterestBaselineY, role.label, role.scale, role.shirtColor, 0));
            const zoneWidth = this.phonePortrait ? 185 : 240;
            const dropZone = this.add.zone(role.x, 365, zoneWidth, 330).setRectangleDropZone(zoneWidth, 330);
            dropZone.setInteractive({useHandCursor: true});
            dropZone.on('pointerup', () => {
                if (this.selectedSelfInterestFood && !this.selectedSelfInterestFood.wasDragged) {
                    if (this.selectedSelfInterestFood.assignedPerson !== role.label) {
                        this.moveSelfInterestFood(this.selectedSelfInterestFood, role.label);
                    }
                } else {
                    const source = this.selfInterestFoods?.find(food => food.assignedPerson === role.label);
                    if (source) {
                        this.clearSelfInterestFoodSelection();
                        this.selectedSelfInterestFood = source;
                        source.setStrokeStyle(3, 0x0066cc);
                    }
                }
            });
            this.selfInterestDropZones[role.label] = dropZone;
            this.addQuestionObject(dropZone);
            const countText = this.add.text(role.x, this.phonePortrait ? 420 : 510, '', {
                fontSize: '20px',
                color: '#000000'
            }).setOrigin(0.5);
            this.selfInterestCountTexts[role.label] = countText;
            this.addQuestionObject(countText);
        });
        this.selfInterestSummaryText = this.add.text(640, this.phonePortrait ? 470 : 555, '', {
            fontSize: '21px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 1050 }
        }).setOrigin(0.5);
        this.addQuestionObject(this.selfInterestSummaryText);
        this.selfInterestSummaryText.setText(this.getSelfInterestMoveInstruction());
        this.createSelfInterestMoveSizeControls();
        this.createSelfInterestFoodPieces();
        this.createSelfInterestActionButton(105, 675, 150, 'Reset', () => {
            this.applySelfInterestAllocation([
                fixedFood.personC,
                fixedFood.personB,
                fixedFood.personA
            ], 'starting_distribution');
        }, 14540253, '#000000');
        this.createSelfInterestActionButton(1070, 675, 270, 'Submit arrangement', () => {
            if (this.allocationStage === 'submitted') return;
            if (isInitial) {
                this.storeFreeAllocation();
                this.allocationStage = 'submitted';
                this.showRedistributionBlock();
            } else {
                this.storeSelfInterestAllocation();
                this.selfInterestDraft = {
                    counts: { ...this.selfInterestCounts },
                    moveSize: this.selfInterestMoveSize,
                    source: this.selfInterestAllocationSource,
                    equalApplied: this.selfInterestEqualApplied,
                    partialApplied: this.selfInterestPartialApplied,
                    startedAt: this.allocationStartedAt
                };
                this.allocationStage = 'submitted';
                this.showManipulationCheck();
            }
        });

        ;
    }
    getSelfInterestMoveInstruction() {
        const size = this.selfInterestMoveSize || 1;
        return `Move up to ${size} ${size === 1 ? 'piece' : 'pieces'} at a time. Drag a fruit to another person.`;
    }
    createSelfInterestMoveSizeControls() {
        this.addQuestionObject(this.add.text(640, this.phonePortrait ? 505 : 612, 'Pieces per move', {
            fontSize: '17px',
            color: '#000000'
        }).setOrigin(0.5));
        const controls = [];
        [1, 2, 4].forEach((size, index) => {
            const active = size === this.selfInterestMoveSize;
            const x = this.phonePortrait ? 420 + index * 220 : 560 + index * 80;
            const button = this.add.rectangle(x, this.phonePortrait ? 550 : 645,
                this.phonePortrait ? 100 : 70, this.phonePortrait ? 88 : 42,
                active ? 0x17212b : 0xe6eaee);
            button.setStrokeStyle(2, 0);
            button.setInteractive({ useHandCursor: true });
            button.setDepth(1000);
            const label = this.add.text(x, this.phonePortrait ? 550 : 645, String(size), {
                fontSize: '22px',
                color: active ? '#ffffff' : '#000000'
            }).setOrigin(0.5);
            label.setInteractive({ useHandCursor: true });
            label.setDepth(1001);
            this.addQuestionObject(button);
            this.addQuestionObject(label);
            controls.push({ size, button, label });
            const selectSize = () => {
                this.selfInterestMoveSize = size;
                controls.forEach(control => {
                    const selected = control.size === size;
                    control.button.setFillStyle(selected ? 0x17212b : 0xe6eaee);
                    control.label.setColor(selected ? '#ffffff' : '#000000');
                });
                this.clearSelfInterestFoodSelection();
            };
            button.on('pointerdown', selectSize);
            label.on('pointerdown', selectSize);
        });
    }
    createSelfInterestFoodPieces() {
        const roles = [
            {
                label: 'Person C',
                amount: this.selfInterestCounts['Person C']
            },
            {
                label: 'Person B',
                amount: this.selfInterestCounts['Person B']
            },
            {
                label: 'Person A',
                amount: this.selfInterestCounts['Person A']
            }
        ];
        this.selfInterestFoods = [];
        roles.forEach(role => {
            for (let index = 0; index < role.amount; index += 1) {
                const food = this.createFoodFruit(0, 0);
                food._portraitPositioned = this.phonePortrait;
                food.setInteractive(new Phaser.Geom.Circle(0, 0, 28), Phaser.Geom.Circle.Contains, { useHandCursor: true });
                food.setDepth(20);
                food.assignedPerson = role.label;
                this.input.setDraggable(food);
                food.on('pointerdown', () => { food.wasDragged = false; });
                food.on('pointerup', () => {
                    if (food.wasDragged) return;
                    if (this.selectedSelfInterestFood && this.selectedSelfInterestFood !== food && this.selectedSelfInterestFood.assignedPerson !== food.assignedPerson) {
                        this.moveSelfInterestFood(this.selectedSelfInterestFood, food.assignedPerson);
                    } else {
                        this.clearSelfInterestFoodSelection();
                        this.selectedSelfInterestFood = food;
                        food.setStrokeStyle(3, 0x0066cc);
                        this.selfInterestSummaryText.setText(this.getSelfInterestMoveInstruction());
                    }
                });
                food.on('dragstart', () => {
                    this.clearSelfInterestFoodSelection();
                    food.wasDragged = true;
                    food.dragGroup = this.getSelfInterestMoveGroup(food);
                    food.dragGroup.forEach((piece, index) => piece.setDepth(100 + index));
                });
                food.on('drag', (pointer, dragX, dragY) => {
                    const offsets = [[0, 0], [10, 0], [0, 10], [10, 10]];
                    (food.dragGroup || [food]).forEach((piece, index) => {
                        piece.x = dragX + offsets[index][0];
                        piece.y = dragY + offsets[index][1];
                    });
                });
                food.on('dragend', () => {
                    const draggedGroup = food.dragGroup || [food];
                    let destination = null;
                    Object.keys(this.selfInterestDropZones).forEach(roleLabel => {
                        const bounds = this.selfInterestDropZones[roleLabel].getBounds();
                        if (Phaser.Geom.Rectangle.Contains(bounds, food.x, food.y)) {
                            destination = roleLabel;
                        }
                    });
                    this.moveSelfInterestFood(food, destination);
                    draggedGroup.forEach(piece => piece.setDepth(20));
                    food.dragGroup = null;
                });
                this.selfInterestFoods.push(food);
                this.addQuestionObject(food);
            }
        });
        this.refreshSelfInterestFoodPositions();
    }
    clearSelfInterestFoodSelection() {
        if (this.selectedSelfInterestFood) this.selectedSelfInterestFood.setStrokeStyle(1.25, 0);
        this.selectedSelfInterestFood = null;
        this.selfInterestSummaryText.setText(this.getSelfInterestMoveInstruction());
    }
    getSelfInterestMoveGroup(food) {
        const source = food.assignedPerson;
        const amount = Math.min(this.selfInterestMoveSize || 1, this.selfInterestCounts[source]);
        return [
            food,
            ...this.selfInterestFoods.filter(piece => piece !== food && piece.assignedPerson === source)
        ].slice(0, amount);
    }
    moveSelfInterestFood(food, destination) {
        if (destination && destination !== food.assignedPerson) {
            const source = food.assignedPerson;
            const group = this.getSelfInterestMoveGroup(food);
            group.forEach(piece => { piece.assignedPerson = destination; });
            this.selfInterestCounts[source] -= group.length;
            this.selfInterestCounts[destination] += group.length;
            this.selfInterestEqualApplied = false;
            this.selfInterestPartialApplied = false;
            this.selfInterestAllocationSource = 'manual';
        }
        this.clearSelfInterestFoodSelection();
        this.refreshSelfInterestFoodPositions();
    }
    refreshSelfInterestFoodPositions() {
        const basketPositions = {
            'Person C': {
                x: (this.phonePortrait ? this.portraitX(1020) : 1020) + 39 * 0.9,
                y: (this.phonePortrait ? this.portraitY(this.selfInterestBaselineY) : this.selfInterestBaselineY) + 31 * 0.9,
                scale: 0.9
            },
            'Person B': {
                x: (this.phonePortrait ? this.portraitX(640) : 640) + 39 * 0.84,
                y: (this.phonePortrait ? this.portraitY(this.selfInterestBaselineY) : this.selfInterestBaselineY) + 31 * 0.84,
                scale: 0.84
            },
            'Person A': {
                x: (this.phonePortrait ? this.portraitX(260) : 260) + 39 * 0.78,
                y: (this.phonePortrait ? this.portraitY(this.selfInterestBaselineY) : this.selfInterestBaselineY) + 31 * 0.78,
                scale: 0.78
            }
        };
        const pileCounts = {
            'Person C': 0,
            'Person B': 0,
            'Person A': 0
        };
        this.selfInterestFoods.forEach(food => {
            const roleLabel = food.assignedPerson;
            const pilePosition = pileCounts[roleLabel];
            const basket = basketPositions[roleLabel];
            pileCounts[roleLabel] += 1;
            food.x = basket.x + this.getBasketFoodOffset(pilePosition, basket.scale).x;
            food.y = basket.y + this.getBasketFoodOffset(pilePosition, basket.scale).y;
        });
        Object.keys(this.selfInterestCountTexts).forEach(roleLabel => {
            const amount = this.selfInterestCounts[roleLabel];
            this.selfInterestCountTexts[roleLabel].setText(`${ amount } ${ amount === 1 ? 'piece' : 'pieces' }`);
        });
    }
    applySelfInterestAllocation(allocation, source) {
        this.clearSelfInterestFoodSelection();
        const totalAssigned = allocation.reduce((sum, amount) => sum + amount, 0);
        if (totalAssigned !== this.selfInterestFoods.length || allocation.some(amount => !Number.isInteger(amount) || amount < 0)) {
            throw new Error('Invalid self-interest allocation preset.');
        }
        const roleLabels = [
            'Person C',
            'Person B',
            'Person A'
        ];
        let foodIndex = 0;
        roleLabels.forEach((roleLabel, roleIndex) => {
            this.selfInterestCounts[roleLabel] = allocation[roleIndex];
            for (let count = 0; count < allocation[roleIndex]; count += 1) {
                this.selfInterestFoods[foodIndex].assignedPerson = roleLabel;
                foodIndex += 1;
            }
        });
        this.selfInterestAllocationSource = source;
        this.selfInterestEqualApplied = source === 'equal_button';
        this.selfInterestPartialApplied = source === 'partial_button';
        this.refreshSelfInterestFoodPositions();
    }
    buildSelfInterestPartialAllocation() {
        return this.buildSurplusOnlyPartialAllocation();
    }
    createSelfInterestActionButton(centerX, centerY, width, label, callback, fillColor = 0, textColor = '#ffffff') {
        if (this.phonePortrait) {
            if (label === 'Reset' && (this.activeTimingScreen === 'showPartialRedistributionTask' ||
                this.activeTimingScreen === 'showEqualDivisionTask')) {
                centerX = 640;
                centerY = 605;
                width = 230;
            } else if (label === 'Reset') {
                centerX = 245;
                centerY = 630;
                width = 190;
            } else {
                centerX = 920;
                centerY = 630;
                width = 310;
            }
        }
        const button = this.add.rectangle(centerX, centerY, width, 52, fillColor);
        button.setStrokeStyle(2, 0);
        button.setInteractive({ useHandCursor: true });
        button.setDepth(1000);
        const text = this.add.text(centerX, centerY, label, {
            fontSize: '18px',
            color: textColor,
            align: 'center',
            wordWrap: { width: width - 18 }
        }).setOrigin(0.5);
        text.setInteractive({ useHandCursor: true });
        text.setDepth(1001);
        this.addQuestionObject(button);
        this.addQuestionObject(text);
        button.on('pointerdown', callback);
        text.on('pointerdown', callback);
    }
    storeSelfInterestAllocation() {
        const fixedFood = this.getFixedFoodCounts();
        const startingAllocation = [
            fixedFood.personC,
            fixedFood.personB,
            fixedFood.personA
        ];
        const finalAllocation = [
            this.selfInterestCounts['Person C'],
            this.selfInterestCounts['Person B'],
            this.selfInterestCounts['Person A']
        ];
        const survivors = finalAllocation.filter(amount => amount >= 8).length;
        const totalMoved = finalAllocation.reduce((sum, amount, index) => sum + Math.abs(amount - startingAllocation[index]), 0) / 2;
        this.gameData.selfInterestAllocationFinal = {
            personC: finalAllocation[0],
            personB: finalAllocation[1],
            personA: finalAllocation[2]
        };
        this.gameData.selfInterestAllocationSurvivors = survivors;
        this.gameData.selfInterestAllocationGini = this.calculateAllocationGini(finalAllocation);
        this.gameData.selfInterestAllocationClassification = this.classifySelfInterestAllocation(finalAllocation, startingAllocation);
        this.gameData.selfInterestAllocationTotalMoved = totalMoved;
        this.gameData.selfInterestAllocationMethod = this.selfInterestAllocationSource;
        this.gameData.selfInterestEqualButtonUsed = this.selfInterestEqualApplied;
        this.gameData.selfInterestPartialButtonUsed = this.selfInterestPartialApplied;
        const roleIndex = {
            'Person C': 0,
            'Person B': 1,
            'Person A': 2
        }[this.gameData.respondentRole];
        if (Number.isInteger(roleIndex)) {
            this.gameData.selfInterestOwnStartingFood = startingAllocation[roleIndex];
            this.gameData.selfInterestOwnFinalFood = finalAllocation[roleIndex];
            this.gameData.selfInterestOwnChange = finalAllocation[roleIndex] - startingAllocation[roleIndex];
        }
    }
    classifySelfInterestAllocation(finalAllocation, startingAllocation) {
        const allocationsMatch = (left, right) => left.every((amount, index) => amount === right[index]);
        if (allocationsMatch(finalAllocation, startingAllocation)) {
            return 'starting_distribution';
        }
        if (finalAllocation.every(amount => amount === finalAllocation[0])) {
            return 'equal_distribution';
        }
        if (allocationsMatch(finalAllocation, this.buildSelfInterestPartialAllocation())) {
            return 'acquisition_priority_maximum_survival';
        }
        const maximumSurvivors = Math.min(finalAllocation.length, Math.floor(finalAllocation.reduce((sum, amount) => sum + amount, 0) / 5));
        const survivors = finalAllocation.filter(amount => amount >= 8).length;
        if (survivors === maximumSurvivors) {
            return 'other_maximum_survival';
        }
        return 'other_distribution';
    }
    calculateAllocationGini(values) {
        const total = values.reduce((sum, amount) => sum + amount, 0);
        if (values.length === 0 || total === 0) {
            return 0;
        }
        let absoluteDifferenceSum = 0;
        values.forEach(left => {
            values.forEach(right => {
                absoluteDifferenceSum += Math.abs(left - right);
            });
        });
        return Number((absoluteDifferenceSum / (2 * values.length * total)).toFixed(4));
    }
    notifyQualtricsComplete(saveStatus) {
        if (!this.qualtricsParentOrigin) {
            console.warn('Qualtrics completion message was not sent because parentOrigin is missing or invalid.');
            return false;
        }
        if (!window.opener || window.opener.closed) {
            console.warn('Qualtrics completion message was not sent because the survey window is unavailable.');
            return false;
        }
        const completionMessage = {
            type: 'survival-game-complete',
            gameId: this.gameData.gameId,
            qualtricsId: this.gameData.qualtricsId,
            saveStatus: saveStatus,
            summary: {
                screenTimings: this.gameData.screenTimings,
                answerChoiceOrders: this.gameData.answerChoiceOrders,
                answerChoiceOrderHistory: this.gameData.answerChoiceOrderHistory,
                economicPrincipleOrder: this.gameData.economicPrincipleOrder,
                redistributionTaskOrder: this.gameData.redistributionTaskOrder,
                redistributionBlocksCompleted: this.gameData.redistributionBlocksCompleted,
                freeAllocationFinal: this.gameData.freeAllocationFinal,
                freeAllocationGini: this.gameData.freeAllocationGini,
                freeAllocationSurvivors: this.gameData.freeAllocationSurvivors,
                freeAllocationTotalMoved: this.gameData.freeAllocationTotalMoved,
                freeAllocationDurationMs: this.gameData.freeAllocationDurationMs,
                redistributionFeasibility: this.gameData.redistributionFeasibility,
                equalGroupInterestChoice: this.gameData.equalGroupInterestChoice,
                partialGroupInterestChoice: this.gameData.partialGroupInterestChoice,
                equalDivisionOutcomeChoice: this.gameData.equalDivisionOutcomeChoice,
                equalDivisionOutcomePassed: this.gameData.equalDivisionOutcomePassed,
                thresholdCheckChoice: this.gameData.thresholdCheckChoice,
                thresholdCheckPassed: this.gameData.thresholdCheckPassed,
                manipulationCheckChoice: this.gameData.manipulationCheckChoice,
                manipulationCheckPassed: this.gameData.manipulationCheckPassed,
                condition: this.gameData.condition,
                gameVersion: this.gameData.gameVersion,
                respondentDecile: this.gameData.respondentDecile,
                respondentRole: this.gameData.respondentRole,
                selfInterestRoleAssignmentSource: this.gameData.selfInterestRoleAssignmentSource,
                selfInterestCondition: this.gameData.selfInterestCondition,
                selfInterestAllocationFinal: this.gameData.selfInterestAllocationFinal,
                selfInterestOwnChange: this.gameData.selfInterestOwnChange,
                equalDivisionFinal: this.gameData.equalDivisionFinal,
                partialRedistributionFinal: this.gameData.partialRedistributionFinal
            }
        };
        window.opener.postMessage(completionMessage, this.qualtricsParentOrigin);
        this.gameData.completionMessageSent = true;
        console.log('Qualtrics completion message sent:', completionMessage);
        return true;
    }
    saveGameDataToGoogleSheets() {
        const googleScriptUrl = 'https://script.google.com/macros/s/AKfycbzd6bRGpnjN0vrM1ZTUNd640ecyPM-wCAFYojwogNJbUJ-2qlbaqaUica4moWKokAF-/exec';
        this.gameData.saveStatus = 'attempted';
        console.log('GOOGLE SCRIPT URL:', googleScriptUrl);
        console.log('DATA BEING SENT:', JSON.stringify(this.gameData));
        return fetch(googleScriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            keepalive: true,
            body: JSON.stringify(this.gameData)
        });
    }
    showFinalGameScreen() {
        this.finishScreenTiming();
        this.disableBackNavigation = true;
        this.clearQuestionScreen();
        this.gameData.gameEndTime = new Date().toISOString();
        this.gameData.totalDurationMs = new Date(this.gameData.gameEndTime) - new Date(this.gameData.gameStartTime);
        this.addQuestionObject(this.add.rectangle(640, 360, 1000, 500, 16777215).setStrokeStyle(4, 0));
        const statusText = this.add.text(640, 270, 'Thank you for completing the Survival Task.\n\nPlease wait while we save your answers.', {
            fontSize: '30px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 850 },
            lineSpacing: 10
        }).setOrigin(0.5);
        this.addQuestionObject(statusText);
        const showCloseButton = () => {
            const closeButton = this.add.rectangle(640, 540, 360, 65, 0);
            closeButton.setInteractive({ useHandCursor: true });
            closeButton.setDepth(50);
            const closeText = this.add.text(640, 540, 'Return to survey', {
                fontSize: '28px',
                color: '#ffffff'
            }).setOrigin(0.5);
            closeText.setInteractive({ useHandCursor: true });
            closeText.setDepth(51);
            this.addQuestionObject(closeButton);
            this.addQuestionObject(closeText);
            const closeGameTab = () => {
                window.close();
                this.addQuestionObject(this.add.text(640, 630, 'If this tab stays open, close it and return to the survey.', {
                    fontSize: '22px',
                    color: '#000000',
                    align: 'center',
                    wordWrap: { width: 850 }
                }).setOrigin(0.5));
            };
            closeButton.on('pointerdown', closeGameTab);
            closeText.on('pointerdown', closeGameTab);
        };
        /*
     * Report completion immediately. This does not
     * contain or enforce any minimum-duration rule.
     */
        this.gameData.saveStatus = 'attempted';
        this.notifyQualtricsComplete('attempted');
        this.saveGameDataToGoogleSheets().then(() => {
            this.gameData.saveStatus = 'request_sent';
            this.notifyQualtricsComplete('request_sent');
            statusText.setText('Your task is complete.\nReturn to the survey to finish.');
            showCloseButton();
            console.log('Google Sheets save request sent.');
        }).catch(error => {
            this.gameData.saveStatus = 'request_failed';
            this.notifyQualtricsComplete('request_failed');
            statusText.setText('We could not finish saving your answers.\nReturn to the survey and notify the researcher.');
            showCloseButton();
            console.error('Google Sheets save failed:', error);
        });
        console.log('FINAL GAME DATA:', this.gameData);
    }
    createAnswerButton(centerX, centerY, label, variableName, value = label) {
        this.recordDisplayedAnswer(variableName, value, label);
        const paddingX = 24;
        const paddingY = 14;
        const text = this.add.text(centerX, centerY, label, {
            fontSize: this.phonePortrait ? '32px' : '22px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: this.phonePortrait ? 570 : 1000 }
        }).setOrigin(0.5);
        const button = this.add.rectangle(centerX, centerY,
            this.phonePortrait ? 620 : text.width + paddingX * 2,
            this.phonePortrait ? Math.max(100, text.height + paddingY * 2) : text.height + paddingY * 2,
            14540253);
        button._portraitNativeSize = this.phonePortrait;
        const previousAnswer = variableName === 'manipulationCheckChoice'
            ? { yes: 'Yes', no: 'No', not_sure: 'Not sure' }[this.gameData[variableName]]
            : this.gameData[variableName];
        button.setStrokeStyle(previousAnswer === value ? 5 : 2, 0);
        button.setInteractive(new Phaser.Geom.Rectangle(0, 0, button.width, button.height), Phaser.Geom.Rectangle.Contains);
        button.setDepth(1);
        text.setDepth(2);
        this.addQuestionObject(button);
        this.addQuestionObject(text);
        if (!this.answerButtons[variableName]) {
            this.answerButtons[variableName] = [];
        }
        this.answerButtons[variableName].push(button);
        button.on('pointerdown', () => {
            this.answerButtons[variableName].forEach(choice => choice.disableInteractive());
            this.answerButtons[variableName].forEach(choice => {
                choice.setStrokeStyle(2, 0);
            });
            button.setStrokeStyle(5, 0);
            this.gameData[variableName] = value;
            console.log('Saved answer:', variableName, value);
            if (variableName === 'equalDivisionOutcomeChoice') {
                this.gameData.equalDivisionOutcomePassed = label ===
                    (this.getFixedFoodCounts().total / 3 >= 8 ? '3 people' : '0 people');
                this.showRedistributionGroupInterestQuestion('equal');
            } else if (variableName === 'equalGroupInterestChoice') {
                this.showGroupDistributionPreferenceQuestion();
            } else if (variableName === 'partialGroupInterestChoice') {
                this.showPartialRedistributionPreferenceQuestion();
            } else if (variableName === 'groupDistributionPreference') {
                this.completeRedistributionBlock('equal');
            } else if (variableName === 'partialRedistributionPreference') {
                this.completeRedistributionBlock('partial');
            } else if (variableName === 'manipulationCheckChoice') {
                this.gameData.manipulationCheckChoice = { Yes: 'yes', No: 'no', 'Not sure': 'not_sure' }[label];
                this.gameData.manipulationCheckPassed = this.gameData.manipulationCheckChoice ===
                    (this.gameData.condition !== 'insufficiency' ? 'yes' : 'no');
                this.showFinalGameScreen();
            } else if (variableName === 'redistributionFeasibility') {
                this.showSocialContractQuestion();
            } else if (variableName === 'socialContractGuarantee') {
                this.showEconomicPrinciple();
            } else if (this.gameData.economicPrincipleOrder?.includes(variableName)) {
                this.showEconomicPrinciple(this.economicPrincipleIndex + 1);
            }
        });
    }
    getButtonStyle() {
        return {
            width: 220,
            height: 60,
            fontSize: '28px',
            fillColor: 0,
            textColor: '#ffffff'
        };
    }
    showNextTaskButtonAt(x, y, callback) {
        const buttonY = 685;
        const button = this.add.rectangle(x, buttonY, 160, 55, 0);
        button.setInteractive({ useHandCursor: true });
        button.setDepth(50);
        const text = this.add.text(x, buttonY, 'Next', {
            fontSize: '28px',
            color: '#ffffff'
        }).setOrigin(0.5);
        text.setInteractive({ useHandCursor: true });
        text.setDepth(51);
        this.addQuestionObject(button);
        this.addQuestionObject(text);
        const goNext = () => {
            callback();
        };
        button.on('pointerdown', goNext);
        text.on('pointerdown', goNext);
    }
    showNextTaskButton(callback) {
        const buttonY = 685;
        const button = this.add.rectangle(640, buttonY, 160, 55, 0);
        button.setInteractive({ useHandCursor: true });
        button.setDepth(50);
        const text = this.add.text(640, buttonY, 'Next', {
            fontSize: '28px',
            color: '#ffffff'
        }).setOrigin(0.5);
        text.setInteractive({ useHandCursor: true });
        text.setDepth(51);
        this.addQuestionObject(button);
        this.addQuestionObject(text);
        const goNext = () => {
            callback();
        };
        button.on('pointerdown', goNext);
        text.on('pointerdown', goNext);
    }
    createGameNextButton(x, y, label, callback) {
        const buttonY = 685;
        const button = this.add.rectangle(x, buttonY, 160, 55, 0);
        button.setInteractive({ useHandCursor: true });
        const text = this.add.text(x, buttonY, label, {
            fontSize: '28px',
            color: '#ffffff'
        }).setOrigin(0.5);
        button.setDepth(1);
        text.setDepth(2);
        this.addGameObject(button);
        this.addGameObject(text);
        button.on('pointerdown', callback);
        text.on('pointerdown', callback);
    }
    createNextButton(x, y, label, callback) {
        const buttonY = y;
        const button = this.add.rectangle(x, buttonY, 160, 55, 0);
        button.setInteractive({ useHandCursor: true });
        button.setDepth(1000);
        const text = this.add.text(x, buttonY, label, {
            fontSize: '26px',
            color: '#ffffff'
        }).setOrigin(0.5);
        text.setInteractive({ useHandCursor: true });
        text.setDepth(1001);
        this.currentNextButton = button;
        this.currentNextText = text;
        this.addQuestionObject(button);
        this.addQuestionObject(text);
        const goNext = () => {
            callback();
        };
        button.on('pointerdown', goNext);
        text.on('pointerdown', goNext);
    }
    portraitX(x) { return x * 9 / 16; }
    portraitY(y) { return y * 16 / 9; }
    layoutPortraitObject(object, gameObject = false) {
        if (!this.phonePortrait || !object || object._portraitLaidOut) return object;
        object._portraitLaidOut = true;
        if (object._portraitPositioned || typeof object.x !== 'number' || typeof object.y !== 'number') return object;
        const x = object.x, y = object.y;
        if (gameObject && this.activeTimingScreen === 'startFoodCollectionTask' && y < 650) {
            if (object.type === 'Text' && y < 130) {
                object.setPosition(40, 70);
                object.setWordWrapWidth(620);
            } else if (x > 900) {
                object.setPosition(360 + x - 1085, 850 + y - 285);
            } else {
                object.setPosition(150 + (x - 170) * .75, 520 + y - 360);
            }
        } else {
            object.setPosition(this.portraitX(x), this.portraitY(y));
            if (object.type === 'Text' && object.originX === 0 && x < 400 &&
                object.style?.wordWrapWidth > 500) object.x = 80;
            if (x === 115 && y === 45) object.setPosition(110, 55);
        }
        if (object.type === 'Text') {
            const wrap = object.style?.wordWrapWidth;
            if (wrap > 620) object.setWordWrapWidth(580);
            const font = Number.parseFloat(object.style?.fontSize);
            if (font > 0 && font < 32) object.setFontSize(32);
        } else if (object.type === 'Rectangle' && !object._portraitNativeSize) {
            if (object.width > 560) object.setScale(Math.min(1, 660 / object.width), 16 / 9);
            else if (object.input && object.height < 100) object.setScale(1, 100 / object.height);
        }
        return object;
    }
    addQuestionObject(object) {
        this.layoutPortraitObject(object);
        this.questionObjects.push(object);
        return object;
    }
    addGameObject(object) {
        this.layoutPortraitObject(object, true);
        this.gameObjects.push(object);
        return object;
    }
    clearQuestionScreen() {
        this.clearInstructionReview();
        if (!this.questionObjects) {
            return;
        }
        this.questionObjects.forEach(object => {
            if (object && object.destroy) {
                object.destroy();
            }
        });
        this.questionObjects = [];
        this.answerButtons = [];
        this.currentNextButton = null;
        this.currentNextText = null;
        const interactiveBoards = new Set([
            'startFoodCollectionTask', 'showDistributionDisplay',
            'showEqualDivisionTask', 'showPartialRedistributionTask',
            'free_allocation'
        ]);
        if (!this.disableBackNavigation && !interactiveBoards.has(this.activeTimingScreen) &&
            this.navigationIndex > 0 &&
            this.navigationHistory.slice(0, this.navigationIndex).some(screen => screen.render)) {
            const backButton = this.add.rectangle(115, 45, 150, 48, 14540253)
                .setStrokeStyle(2, 0).setDepth(1000).setInteractive({ useHandCursor: true });
            const backText = this.add.text(115, 45, 'Back', {
                fontSize: '24px', color: '#000000'
            }).setOrigin(0.5).setDepth(1001).setInteractive({ useHandCursor: true });
            backButton.on('pointerdown', () => this.goBack());
            backText.on('pointerdown', () => this.goBack());
            this.addQuestionObject(backButton);
            this.addQuestionObject(backText);
        }
    }
    clearGameObjects() {
        if (!this.gameObjects) {
            return;
        }
        this.gameObjects.forEach(object => {
            if (object && object.destroy) {
                object.destroy();
            }
        });
        this.gameObjects = [];
    }

    showFoodPolicyTransition(title, detail, next, taskId = title, emphasis = null) {
        this.enterRecordedScreen('transition_' + taskId,
            () => this.showFoodPolicyTransition(title, detail, next, taskId, emphasis));
        this.clearQuestionScreen();
        this.clearGameObjects();
        this.addQuestionObject(this.add.rectangle(640, 360, 1120, 600, 16777215).setStrokeStyle(3, 0));
        this.addQuestionObject(this.add.text(640, 180, title, {fontSize: '32px', color: '#000000', align: 'center', wordWrap: {width: 980}}).setOrigin(0.5));
        if (emphasis) {
            const style = {fontSize: '27px', color: '#000000', align: 'center', wordWrap: {width: 960}};
            this.addQuestionObject(this.add.text(640, 280, emphasis.before, style).setOrigin(0.5));
            this.addQuestionObject(this.add.text(640, 350, emphasis.focus, {...style, fontStyle: 'bold'}).setOrigin(0.5));
            this.addQuestionObject(this.add.text(640, 420, emphasis.after, style).setOrigin(0.5));
        } else {
            this.addQuestionObject(this.add.text(640, 350, detail, {fontSize: '27px', color: '#000000', align: 'center', wordWrap: {width: 960}}).setOrigin(0.5));
        }
        this.createNextButton(640, 620, 'Continue', () => {
            next();
        });

        ;
    }
    storeFreeAllocation() {
        const f = this.getFixedFoodCounts();
        const initial = [f.personC, f.personB, f.personA];
        const values = ['Person C', 'Person B', 'Person A'].map(p => this.selfInterestCounts[p]);
        if (values.some(n => !Number.isInteger(n) || n < 0) || values.reduce((a,b) => a+b, 0) !== f.total) throw new Error('Invalid free allocation');
        this.gameData.freeAllocationFinal = {personC: values[0], personB: values[1], personA: values[2]};
        this.gameData.freeAllocationGini = this.calculateAllocationGini(values);
        this.gameData.freeAllocationSurvivors = values.filter(n => n >= 8).length;
        this.gameData.freeAllocationTotalMoved = values.reduce((sum,n,i) => sum + Math.abs(n-initial[i]),0)/2;
        this.gameData.freeAllocationDurationMs = Date.now() - this.allocationStartedAt;
    }
    showManipulationCheck() {
        this.enterRecordedScreen('showManipulationCheck');
        this.clearQuestionScreen();
        this.addQuestionObject(this.add.rectangle(640, this.phonePortrait ? 390 : 360, 1120, 600, 16777215).setStrokeStyle(3, 0));
        this.addQuestionObject(this.add.text(640, 200,
            'Was there enough food in total for all three people to have at least 8 pieces each?',
            {fontSize: '29px', color: '#000000', align: 'center', wordWrap: {width: 960}}
        ).setOrigin(0.5));
        let answers = ['Yes', 'No'];
        if (Phaser.Math.Between(0, 1) === 1) answers.reverse();
        answers.push('Not sure');
        answers = this.getStableAnswerOrder('manipulationCheckChoice', answers);
        answers.forEach((label, i) => this.createAnswerButton(640, 350 + i * 90, label, 'manipulationCheckChoice'));
    }
    showRedistributionFeasibility() {
        this.enterRecordedScreen('showRedistributionFeasibility');
        this.clearQuestionScreen();
        this.addQuestionObject(this.add.rectangle(640, this.phonePortrait ? 390 : 360, 1120, 600, 16777215).setStrokeStyle(3, 0));
        this.addQuestionObject(this.add.text(640, 200, 'In this scenario, is there enough food for everyone?', {fontSize: '29px', color: '#000000', align: 'center', wordWrap: {width: 960}}).setOrigin(0.5));
        let answers = ['Yes, there is enough food for everyone.', 'No, there is not enough food for everyone.'];
        if (Phaser.Math.Between(0, 1) === 1) answers.reverse();
        answers = this.getStableAnswerOrder('redistributionFeasibility', answers);
        answers.forEach((label,i) => this.createAnswerButton(640, 350+i*140, label, 'redistributionFeasibility', label.startsWith('Yes,') ? 'Yes' : 'No'));

        ;
    }

    addInstructionReview(text, x = 150, onReview = null) {
        this.reviewInstructionsText = text;
        const button = this.add.rectangle(x, 675, 250, 42, 0xffffff).setStrokeStyle(2, 0x263238).setDepth(2000).setInteractive({useHandCursor: true});
        const label = this.add.text(x, 675, 'Review instructions', {fontFamily: 'Arial', fontSize: '20px', color: '#263238'}).setOrigin(0.5).setDepth(2001);
        this.reviewInstructionsControls = [button, label];
        button.on('pointerdown', () => { if (onReview) onReview(); else this.openInstructionReview(); });
    }
    openInstructionReview() {
        if (this.instructionReviewOverlay) return;
        const disabled = [];
        const visit = object => {
            if (object.input && object.input.enabled) { disabled.push(object); object.input.enabled = false; }
            if (object.list) object.list.forEach(visit);
        };
        this.children.list.forEach(visit);
        const pausedTime = this.time.paused;
        this.time.paused = true;
        const tweens = this.tweens.getTweens().filter(tween => !tween.paused);
        tweens.forEach(tween => tween.pause());
        const objects = [];
        const add = object => { objects.push(object); return object; };
        const shade = add(this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.55).setDepth(10000).setInteractive());
        const stop = (...args) => { const event = args[args.length - 1]; if (event && event.stopPropagation) event.stopPropagation(); };
        ['pointerdown', 'pointerup', 'pointermove'].forEach(event => shade.on(event, stop));
        add(this.add.rectangle(640, 360, 1020, 500, 0xffffff).setStrokeStyle(3, 0x263238).setDepth(10001));
        add(this.add.text(640, 165, 'Review instructions', {fontFamily: 'Arial', fontSize: '30px', color: '#17212b'}).setOrigin(0.5).setDepth(10002));
        add(this.add.text(640, 340, this.reviewInstructionsText, {fontFamily: 'Arial', fontSize: '26px', color: '#17212b', align: 'center', wordWrap: {width: 890}, lineSpacing: 12}).setOrigin(0.5).setDepth(10002));
        const close = add(this.add.rectangle(640, 550, 260, 56, 0x17212b).setDepth(10003).setInteractive({useHandCursor: true}));
        add(this.add.text(640, 550, 'Return to task', {fontFamily: 'Arial', fontSize: '24px', color: '#ffffff'}).setOrigin(0.5).setDepth(10004));
        this.instructionReviewOverlay = {objects, disabled, pausedTime, tweens};
        close.on('pointerup', (...args) => { stop(...args); this.closeInstructionReview(); });
    }
    closeInstructionReview() {
        const overlay = this.instructionReviewOverlay;
        if (!overlay) return;
        this.instructionReviewOverlay = null;
        overlay.objects.forEach(object => object.destroy());
        overlay.disabled.forEach(object => { if (object.active && object.input) object.input.enabled = true; });
        this.time.paused = overlay.pausedTime;
        overlay.tweens.forEach(tween => { if (tween.parent) tween.resume(); });
    }
    clearInstructionReview() {
        this.closeInstructionReview();
        (this.reviewInstructionsControls || []).forEach(object => { if (object.active) object.destroy(); });
        this.reviewInstructionsControls = [];
    }
}
