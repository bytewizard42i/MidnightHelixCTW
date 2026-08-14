# CockroachDB x AWS Hackathon Requirements

This checklist summarizes the official rules that materially affect
MHelixCTW. The rules remain controlling:
<https://cockroachdb-ai.devpost.com/rules>.

## Dates

- Submission period: June 30, 2026, 10:00 AM EDT through August 18, 2026,
  5:00 PM EDT
- Judging: August 19, 2026, 10:00 AM EDT through September 15, 2026,
  5:00 PM EDT
- Winners: on or around September 21, 2026, 3:00 PM EDT

## Required project

- Agentic application
- CockroachDB as the persistent memory layer
- Deployed on AWS
- Required CockroachDB and AWS components meaningfully integrated
- At least two qualifying CockroachDB tools
- At least one qualifying AWS service

MHelixCTW targets:

- CockroachDB Distributed Vector Indexing
- CockroachDB Cloud Managed MCP Server
- AWS API Gateway
- AWS Lambda
- Amazon Bedrock
- AWS Secrets Manager and CloudWatch as supporting services

## Repository

- Public and open source
- Root license visible and detectable by GitHub
- Complete source code
- Dependencies and example configuration
- Example synthetic data
- Setup and run instructions

The rules recommend MIT or Apache-2.0. MHelixCTW uses Apache-2.0 for
consistency with the imported entrant-owned source and its explicit patent
license.

## New-project and prior-work rule

The project must be newly created during the submission period. Standard tools,
frameworks, starter templates, and Ai coding assistants are permitted. Other
pre-existing code or work must be disclosed, and the submitted work must have
been built during the submission period.

MHelixCTW therefore maintains:

- `PREEXISTING_WORK.md`
- file-level source inventory and hashes
- a hackathon roadmap and later change log
- explicit source and media provenance

## Demo and video

- Functional public demo URL
- Free and unrestricted judge access through the judging period
- Public YouTube or Vimeo video
- Video under three minutes
- Video must show the project functioning
- Video must show the CockroachDB memory layer at work
- No unlicensed copyrighted music or material

## Submission description

The Devpost entry must identify:

- which CockroachDB tools were used;
- what the agent actually did with each tool;
- which AWS services were used and how;
- the role of CockroachDB memory;
- what is real, TestWired, mocked, planned, and synthetic; and
- the pre-existing source baseline.

## Judging priorities

The five criteria are equally weighted:

1. Agentic Memory Design
2. Technological Implementation
3. Real-World Impact
4. Product Readiness
5. Creativity and Originality

Agentic Memory Design is the first tie-break criterion. The demo must therefore
lead with cross-session memory changing agent behavior, not with a general
architecture lecture.

## MHelixCTW eligibility position

- The public repository and integrated application are new.
- The Helix adapter baseline is disclosed and attributed.
- The TestTown snapshot is public, fictional, pinned, and attributed.
- New CockroachDB memory, vector, Managed MCP, AWS, Midnight, reconstruction,
  UI, security, and testing work is separately identified.
- Creating a new Git history does not make imported work new.

Written clarification should be requested from the organizer if any
pre-existing-work interpretation remains ambiguous before submission.
