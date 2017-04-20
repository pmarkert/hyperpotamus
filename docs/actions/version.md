# `version` action
The `version` action ensures that the version of hyperpotamus being used to execute the script matches at least one of the expected/required versions.

## Syntax
```YAML
version: "semver range" # [ "semver range"... ]
```

The value of `version` can be a single version specification (string) or an array of version specification strings. Each version specification represents a [semver](http://semver.org) version range specification. If an array of versions is provided, then the action will succeed if any one of the versions matches.

## Notes
### Version ranges and specifiers
The `version` action supports semver ranges and major/minor compatibility specifiers.

## Errors
### VersionMismatchError
The version of hyperpotamus did not match any of the expected version specifications.
```YAML
# Raises VersionMisMatchError
version: 0.0.0
```

### Checking the current version
To check the current version of hyperpotamus, execute `hyperpotamus --version`.

### Upgrading hyperpotamus
To upgrade to the latest version of hyperpotamus execute `npm install -g hyperpotamus`. To upgrade to a specific version, `npm install -g hyperpotamus@1.0.0`.

## Examples
```YAML
version: 1.0.0
```
