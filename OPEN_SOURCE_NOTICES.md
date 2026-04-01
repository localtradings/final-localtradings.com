# Open Source Notices

This application includes third-party open-source software.

The notices below are included so the origin and license status of those
components remain clear during development, deployment, due diligence, and any
future sale or transfer of the business.

This file is an operational notice only. It is not legal advice.

## Chart line tools

The backtesting chart integrates line/drawing tool code based on the
`lightweight-charts-line-tools` ecosystem by `difurious`.

These components are used in two ways in this repository:

### 1. Installed package dependencies

The following chart-tool packages are installed as dependencies and imported
from `node_modules`:

- `lightweight-charts-line-tools-core`
- `lightweight-charts-line-tools-lines`
- `lightweight-charts-line-tools-rectangle`
- `lightweight-charts-line-tools-freehand`
- `lightweight-charts-line-tools-circle`
- `lightweight-charts-line-tools-fib-retracement`

These dependencies are declared in:

- [package.json](./package.json)

### 2. Vendored source files

The following additional chart-tool plugins are included as vendored source
inside this repository because a clean package-based integration was not used
for that batch:

- `Text`
- `Triangle`
- `Parallel Channel`
- `Price Range`
- `Long/Short Position`

Vendored source location:

- [src/features/backtesting/vendor/line-tools-extra](./src/features/backtesting/vendor/line-tools-extra)

These vendored files remain third-party code. Copying them into this
repository does not remove or replace their original license obligations.

## License

The `lightweight-charts-line-tools` components referenced above are treated as
`MPL-2.0` licensed components based on the dependency metadata recorded in:

- [package-lock.json](./package-lock.json)

Practical meaning for this repository:

- The application may include proprietary code alongside these components.
- The presence of MPL-covered files does not by itself make the entire
  application open source.
- MPL-covered files remain subject to their original license terms.
- If MPL-covered files are modified and distributed, those modified files must
  continue to comply with MPL-2.0 requirements.

For the official MPL information and FAQ, see:

- https://www.mozilla.org/en-US/MPL/
- https://www.mozilla.org/en-US/MPL/2.0/FAQ/

## Ownership and transfer

The owners of this application may sell or transfer the business, website,
domain, database, customer relationships, and proprietary application code.

However, third-party open-source components listed here are transferred subject
to their original licenses. They are not converted into exclusively owned
proprietary assets merely because they are used in this repository.

## Maintenance note

The chart-tool integration currently uses a mixed source strategy:

- the first tool batch is dependency-managed through `package.json`
- the second tool batch is vendored into the repository

If this chart system becomes long-term core product infrastructure, a cleaner
future approach would be to standardize on one of these:

- maintain an internal fork/package
- or return to a fully package-based integration when upstream builds are
  reliable
