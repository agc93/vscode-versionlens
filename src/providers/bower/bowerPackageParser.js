/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Peter Flannery. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { gitHubDependencyRegex } from 'common/utils';
import appSettings from 'common/appSettings';
import * as PackageFactory from 'common/packageGeneration';

const semver = require('semver');

export function bowerPackageParser(name, version, appContrib) {
  let result;

  // check if we have a github version
  result = parseGithubVersion(name, version, appContrib.githubTaggedCommits);
  if (result)
    return result;

  // check if its a valid semver, if not could be a tag
  const isValidSemver = semver.validRange(version);

  const meta = {
    type: 'bower',
    tag: {
      name: 'latest',
      version: 'latest',
      isInvalid: !isValidSemver
    }
  };

  return PackageFactory.createPackage(
    name,
    version,
    meta
  );
}

export function parseGithubVersion(packageName, packageVersion, githubTaggedVersions) {
  const gitHubRegExpResult = gitHubDependencyRegex.exec(packageVersion);
  if (!gitHubRegExpResult)
    return;

  const proto = "https";
  const user = gitHubRegExpResult[1];
  const repo = gitHubRegExpResult[3];
  const userRepo = `${user}/${repo}`;
  const commitish = gitHubRegExpResult[4] ? gitHubRegExpResult[4].substring(1) : '';
  const commitishSlug = commitish ? `/commit/${commitish}` : '';
  const remoteUrl = `${proto}://github.com/${user}/${repo}${commitishSlug}`;

  // take a copy of the app config tagged versions
  const taggedVersions = githubTaggedVersions.slice();

  // ensure that commits are the first and the latest entries to be shown
  taggedVersions.splice(0, 0, 'Commit');

  // only show commits of showTaggedVersions is false
  if (appSettings.showTaggedVersions === false)
    githubTaggedVersions = [githubTaggedVersions[0]];

  return githubTaggedVersions.map(category => {
    const meta = {
      category,
      type: "github",
      remoteUrl,
      userRepo,
      commitish
    };

    return PackageFactory.createPackage(
      packageName,
      packageVersion,
      meta,
      (packageInfo, newVersion) => `${packageInfo.meta.userRepo}#${newVersion}`
    );
  });
}