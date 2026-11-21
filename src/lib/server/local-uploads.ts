import { execFile } from "node:child_process";
import { constants } from "node:fs";
import {
  access,
  mkdir,
  readdir,
  readFile,
  realpath,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { promisify } from "node:util";
import { HttpError } from "./http";

const run = promisify(execFile);

export function supportsLocalUploads() {
  return (
    process.platform === "win32" &&
    /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(
      process.env.APP_ORIGIN || "",
    ) &&
    /^mongodb:\/\/127\.0\.0\.1(?::\d+)?\//.test(process.env.MONGODB_URI || "")
  );
}

function configuredDirectory() {
  const directory = process.env.LOCAL_UPLOAD_DIR?.trim();
  if (!directory) return;
  if (!supportsLocalUploads()) {
    throw new HttpError(
      503,
      "LOCAL_UPLOAD_DIR requires a Windows localhost server and MongoDB on 127.0.0.1.",
    );
  }
  if (!isAbsolute(directory)) {
    throw new HttpError(
      503,
      "Set LOCAL_UPLOAD_DIR to an absolute private folder path.",
    );
  }
  return resolve(directory);
}

export function localUploadsEnabled() {
  return Boolean(configuredDirectory());
}

function contains(parent: string, directory: string) {
  const fromParent = relative(parent, directory);
  return (
    !isAbsolute(fromParent) &&
    fromParent !== ".." &&
    !fromParent.startsWith(".." + sep)
  );
}

async function privateDirectory(writing = false) {
  const directory = configuredDirectory();
  if (!directory)
    throw new HttpError(503, "Local attachment storage is not configured.");
  const publicDirectories = [resolve("public")];
  for (const dir of [
    process.env.LOCAL_CATALOG_MEDIA_DIR,
    process.env.CATALOG_MEDIA_DIR,
  ]) {
    if (dir?.trim()) publicDirectories.push(resolve(dir.trim()));
  }
  function check(candidate: string, publicPaths: string[]) {
    if (
      publicPaths.some(
        (dir) => contains(dir, candidate) || contains(candidate, dir),
      )
    ) {
      throw new HttpError(
        503,
        "LOCAL_UPLOAD_DIR must be a separate private folder outside public and catalog media directories.",
      );
    }
  }
  check(directory, publicDirectories);
  try {
    if (writing) await mkdir(directory, { recursive: true });
    const resolved = await realpath(directory);
    check(
      resolved,
      await Promise.all(
        publicDirectories.map((dir) => realpath(dir).catch(() => dir)),
      ),
    );
    if (writing) await access(resolved, constants.W_OK);
    return resolved;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(
      503,
      "Could not open LOCAL_UPLOAD_DIR. Check the folder path and its permissions.",
    );
  }
}

async function uploadPath(id: string, version: string, writing = false) {
  if (!/^[a-f0-9]{24}$/.test(id) || !/^[a-f0-9-]{36}$/.test(version))
    throw new HttpError(404, "File unavailable");
  const directory = await privateDirectory(writing);
  return join(directory, id + "-" + version + ".upload");
}

async function isFile(path: string) {
  return (await stat(path).catch(() => null))?.isFile() ?? false;
}

async function localScanner() {
  const executable = process.env.LOCAL_UPLOAD_SCANNER?.trim();
  if (executable) {
    if (isAbsolute(executable) && (await isFile(executable))) return executable;
    throw new HttpError(
      503,
      "LOCAL_UPLOAD_SCANNER must point to an existing MpCmdRun.exe using an absolute path.",
    );
  }

  const platform = join(
    process.env.ProgramData || "C:/ProgramData",
    "Microsoft",
    "Windows Defender",
    "Platform",
  );
  const versions = (
    await readdir(platform, { withFileTypes: true }).catch(() => [])
  )
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true }));
  const candidates = [
    ...versions.map((entry) => join(platform, entry.name, "MpCmdRun.exe")),
    join(
      process.env.ProgramFiles || "C:/Program Files",
      "Windows Defender",
      "MpCmdRun.exe",
    ),
  ];
  for (const candidate of candidates) {
    if (isAbsolute(candidate) && (await isFile(candidate))) return candidate;
  }
  throw new HttpError(
    503,
    "Windows Defender was not found. Set LOCAL_UPLOAD_SCANNER to the path of MpCmdRun.exe.",
  );
}

export async function checkLocalUploadStorage() {
  await localScanner();
  await privateDirectory(true);
}

export async function scanAndStoreUpload(
  id: string,
  version: string,
  bytes: Buffer,
) {
  const executable = await localScanner();
  const target = await uploadPath(id, version, true);
  try {
    await writeFile(target, bytes, { flag: "wx", mode: 0o600 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST")
      await rm(target, { force: true }).catch(() => {});
    throw new HttpError(
      503,
      "Could not write the attachment to LOCAL_UPLOAD_DIR. Check the folder permissions and available disk space.",
    );
  }
  try {
    await run(
      executable,
      ["-Scan", "-ScanType", "3", "-File", target, "-DisableRemediation"],
      {
        windowsHide: true,
        timeout: 90000,
      },
    );
  } catch (error) {
    await rm(target, { force: true }).catch(() => {});
    if ((error as { code?: number }).code === 2)
      throw new HttpError(422, "The attachment did not pass the local scan.");
    throw new HttpError(
      503,
      "The local attachment scanner could not complete the scan.",
    );
  }
}

export async function readLocalUpload(id: string, version: string) {
  const target = await uploadPath(id, version);
  try {
    return await readFile(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      throw new HttpError(
        404,
        "Attachment file is missing from local storage.",
      );
    throw new HttpError(
      503,
      "Could not read the attachment from LOCAL_UPLOAD_DIR.",
    );
  }
}

export async function removeLocalUpload(id: string, version: string) {
  return rm(await uploadPath(id, version), { force: true });
}
