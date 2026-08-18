# Video Script - CockroachDB x AWS Hackathon (under 3 minutes)

**Target**: 2:55
**Demo URL**: https://HelixCTW.com
**Recording**: Screen record the browser, read the narration, click through the checkpoints

---

## [0:00 - SCREEN: HelixCTW.com loaded]

> This is HelixCTW, live right now at HelixCTW.com.

## [0:08 - Show the landing page]

> It is a privacy-preserving registry with an AI agent that manages identity, assets, and credentials. CockroachDB is the persistent memory layer. AWS Lambda serves the API. And the core idea is simple: prove one thing, and nothing more.

## [0:20 - Click "Choose Backend" in the upper right corner]

> We will start the live demo by choosing our backend.

## [0:25 - Click the center AWS card]

> We select the AWS backend. This connects us to the live TestWired environment running on AWS Lambda and CockroachDB Cloud.

## [0:32 - Show the backend info page]

> From here we can see the provider matrix and the checkpoint overview. Every checkpoint advances only after the real API returns valid evidence. A disabled button is a truthful boundary.

## [0:42 - Click the green "Start Guided Tour" button]

> Let us start the guided tour. We will walk through a 7-checkpoint privacy proof using the Morrow Family Farmhouse, a fictional property in TestTown.

## [0:52 - Checkpoint 1: Open Session A]

> Checkpoint 1. We ask the live API to create a bounded run with a narrow property predicate: is this property unencumbered?
>
> The request goes through Amazon API Gateway into AWS Lambda, which opens a serializable transaction against CockroachDB Cloud. The session is persisted. AWS Secrets Manager holds the connection credentials so nothing is hardcoded.

## [1:10 - Checkpoint 1 passes, click Continue]

## [1:12 - Checkpoint 2: Close Session]

> Checkpoint 2. We close the session. The browser forgets the chat. But CockroachDB retains the durable memory.

## [1:20 - Checkpoint 2 passes]

## [1:22 - Checkpoint 3: Recall in Session B]

> Checkpoint 3. We open a fresh session and ask: where were we, and what am I allowed to ask?
>
> This is where CockroachDB Distributed Vector Indexing does the work. The recall query pins the run ID and projection generation as exact-value prefix columns, then orders by cosine distance using the vector cosine ops operator class. The agent recovers context with zero browser storage. The vector and its commitment never leave the database.

## [1:45 - Checkpoint 3 passes]

## [1:47 - Checkpoint 4: Verify Predicate]

> Checkpoint 4. We ask the permitted question: is this property unencumbered?
>
> The API returns one authorized bit: true. No deed text. No mortgage record. No owner information. Just the answer.

## [2:00 - Checkpoint 4 passes]

## [2:02 - Checkpoint 5: Privacy Boundary]

> Checkpoint 5. We test the privacy boundary. An unauthorized agent requests the full deed, the mortgage record, the owner birth date, and private contact info.
>
> The API denies every single field. Memory cannot become permission. The protected fields are allowlisted by the protocol contract. The agent cannot escalate.

## [2:20 - Checkpoint 5 passes]

## [2:22 - Checkpoint 6: Rebuild Projection]

> Checkpoint 6. We rebuild the recall projection. This is a disposable shadow index rebuilt from the same canonical corpus.
>
> The evidence commitment stays stable, proving the canonical source set was preserved. This is not whole-database recovery. It is a targeted projection rebuild, and the commitment is anchored to the original generation, not the current active one.

## [2:42 - Checkpoint 6 passes]

## [2:44 - Checkpoint 7: Verify Continuity]

> Checkpoint 7. We ask the permitted question again through the new projection generation. Same canonical memory. Same commitment. Same predicate. Same value. Continuity verified.

## [2:52 - Checkpoint 7 passes, confetti plays]

> HelixCTW. Prove one thing, and nothing more.

---

## Trim guide

If running over 3 minutes, the quickest cuts are:

- Checkpoint 2: just read the one-liner and click through
- Checkpoint 7: just read the one-liner and click through

The CockroachDB and AWS mentions are all in Checkpoints 1, 3, and the opening, so they survive any trim.

## CockroachDB tools mentioned

- Distributed Vector Indexing (Checkpoint 3)
- Managed MCP Server (provider matrix visible on backend info page)

## AWS services mentioned

- AWS Lambda (Checkpoint 1)
- Amazon API Gateway (Checkpoint 1)
- AWS Secrets Manager (Checkpoint 1)
- Amazon Bedrock (opening, production path)
