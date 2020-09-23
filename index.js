const IScriptTypes = {
  0: 2,
  1: 2,
  2: 4,
  12: 14,
  13: 14,
  14: 16,
  15: 16,
  20: 22,
  21: 22,
  23: 24,
  24: 26,
  26: 28,
  27: 28,
  28: 28,
  29: 28,
};

const typeFrame = { size: 2, name: "frame" };
const typeFrameset = { size: 1, name: "frameset" };
const typeSByte = { size: 1, name: "sbyte" };
const typeByte = { size: 1, name: "byte" };
const typeLabel = { size: 2, name: "label" };
const typeImageId = { size: 2, name: "imageid" };
const typeSpriteId = { size: 2, name: "spriteid" };
const typeFlingy = { size: 2, name: "flingy" };
const typeFlipState = { size: 1, name: "flipstate" };
const typeSoundId = { size: 2, name: "soundid" };
const typeSounds = { size: 1, name: "sounds" };
const typeSignalId = { size: 1, name: "signalid" };
const typeWeapon = { size: 1, name: "weapon" };
const typeWeaponId = { size: 1, name: "weaponid" };
const typeSpeed = { size: 2, name: "speed" };
const typeBFrame = { size: 1, name: "bframe" };
const typeGasOverlay = { size: 1, name: "gasoverlay" };
const typeShort = { size: 2, name: "short" };
const typeOverlayId = { size: 1, name: "overlayid" };

const IScriptOPCodes = [
  ["playfram", [typeFrame]],
  ["playframtile", [typeFrame]],
  ["sethorpos", [typeSByte]],
  ["setvertpos", [typeSByte]],
  ["setpos", [typeSByte, typeSByte]],
  ["wait", [typeByte]],
  ["waitrand", [typeByte, typeByte]],
  ["goto", [typeLabel]],
  ["imgol", [typeImageId, typeSByte, typeSByte]],
  ["imgul", [typeImageId, typeSByte, typeSByte]],
  ["imgolorig", [typeImageId]],
  ["switchul", [typeImageId]],
  ["__0c", []],
  ["imgoluselo", [typeImageId, typeSByte, typeSByte]],
  ["imguluselo", [typeImageId, typeSByte, typeSByte]],
  ["sprol", [typeSpriteId, typeSByte, typeSByte]],
  ["highsprol", [typeSpriteId, typeSByte, typeSByte]],
  ["lowsprul", [typeSpriteId, typeSByte, typeSByte]],
  ["uflunstable", [typeFlingy]],
  ["spruluselo", [typeSpriteId, typeSByte, typeSByte]],
  ["sprul", [typeSpriteId, typeSByte, typeSByte]],
  ["sproluselo", [typeSpriteId, typeOverlayId]],
  ["end", []],
  ["setflipstate", [typeFlipState]],
  ["playsnd", [typeSoundId]],
  ["playsndrand", [typeSounds, typeSoundId]],
  ["playsndbtwn", [typeSoundId, typeSoundId]],
  ["domissiledmg", []],
  ["attackmelee", [typeSounds, typeSoundId]],
  ["followmaingraphic", []],
  ["randcondjmp", [typeByte, typeLabel]],
  ["turnccwise", [typeByte]],
  ["turncwise", [typeByte]],
  [["turn1cwise", "turnlcwise"], []],
  ["turnrand", [typeByte]],
  ["setspawnframe", [typeByte]],
  ["sigorder", [typeSignalId]],
  ["attackwith", [typeWeapon]],
  ["attack", []],
  ["castspell", []],
  ["useweapon", [typeWeaponId]],
  ["move", [typeByte]],
  ["gotorepeatattk", []],
  ["engframe", [typeBFrame]],
  ["engset", [typeFrameset]],
  ["__2d", []],
  ["nobrkcodestart", []],
  ["nobrkcodeend", []],
  ["ignorerest", []],
  ["attkshiftproj", [typeByte]],
  ["tmprmgraphicstart", []],
  ["tmprmgraphicend", []],
  ["setfldirect", [typeByte]],
  ["call", [typeLabel]],
  ["return", []],
  ["setflspeed", [typeSpeed]],
  ["creategasoverlays", [typeGasOverlay]],
  ["pwrupcondjmp", [typeLabel]],
  ["trgtrangecondjmp", [typeShort, typeLabel]],
  ["trgtarccondjmp", [typeShort, typeShort, typeLabel]],
  ["curdirectcondjmp", [typeShort, typeShort, typeLabel]],
  ["imgulnextid", [typeSByte, typeSByte]],
  ["__3e", []],
  ["liftoffcondjmp", [typeLabel]],
  ["warpoverlay", [typeFrame]],
  ["orderdone", [typeSignalId]],
  ["grdsprol", [typeSpriteId, typeSByte, typeSByte]],
  ["__43", []],
  ["dogrddamage", []],
];

//https://stackoverflow.com/questions/3895478/does-javascript-have-a-method-like-range-to-generate-a-range-within-the-supp
const range = (startAt, size) => {
  return [...Array(size).keys()].map((i) => i + startAt);
};

const read = (buf, size, pos) => {
  let value = null;
  if (size === 1) {
    value = buf.readUInt8(pos);
  } else if (size === 2) {
    value = buf.readUInt16LE(pos);
  }
  return value;
};

const iscript = (buf) => {
  const iscripts = [];
  const animationBlocks = {};

  function loadAnimationBlock(offset) {
    if (!offset || animationBlocks[offset]) {
      return;
    }
    let nextOffset = offset;
    animationBlocks[offset] = [];

    while (nextOffset && nextOffset < buf.byteLength) {
      const res = loadCommand(nextOffset);
      const [cmd, nextPos] = res;
      nextOffset = nextPos;
      animationBlocks[offset].push([
        cmd.op.opName,
        cmd.args.map(({ val }) => val),
      ]);
    }
  }

  function loadCommand(offset) {
    if (offset === 0) {
      throw new Error("invalid offset");
    }
    const opIndex = buf.readUInt8(offset);
    if (opIndex >= IScriptOPCodes.length) {
      throw new Error("invalid command");
    }

    const [opName, params] = IScriptOPCodes[opIndex];
    const op = { opName, opIndex, offset };
    const args = [];
    let newPos = offset + 1;
    if (params.length) {
      if (params[0].name != "sounds") {
        newPos = params.reduce((pos, { name, size }) => {
          args.push({ name, val: read(buf, size, pos), size });
          return pos + size;
        }, newPos);
      } else {
        const [sounds, { name, size }] = params;

        const numSounds = read(buf, sounds.size, offset + sounds.size);
        args.push({ name: sounds.name, val: numSounds, special: true });
        range(0, numSounds).forEach((x) => {
          args.push({
            name,
            val: read(buf, size, offset + 2 + size * x),
          });
        });
        newPos = offset + 2 + size * numSounds;
      }
    } //end params

    if (opIndex == 7) {
      //goto
      loadAnimationBlock(args[0].val);
      newPos = null;
    } else if ([22, 54].includes(opIndex)) {
      //end and return
      newPos = null;
    } else if ([30, 53, 57, 58, 59, 60, 63].includes(opIndex)) {
      //randcondjump,call,pwrupcondjmp,trgtrangecondjmp,trgtarccondjmp,curdirectcondjmp,liftoffcondjump
      //@todo probably need to understand what else is getting loaded
      loadAnimationBlock(args[args.length - 1].val);
    }

    return [{ op, args }, newPos];
  }

  function loadNextIScript(pos) {
    if (pos > buf.byteLength - 4) return;

    const iscriptIndex = buf.readUInt16LE(pos);
    if (iscripts[iscriptIndex]) {
      throw new Error("duplicate header id");
    }

    const offset = buf.readUInt16LE(pos + 2);

    if (iscriptIndex == 65535 && offset == 0) {
      return;
    }

    if (buf.toString("utf8", offset, offset + 4) != "SCPE") {
      throw new Error(`invalid header`);
    }

    const iscript = {
      id: iscriptIndex,
      type: buf.readUInt8(offset + 4),
      offset,
      offsets: [],
    };

    const ct = IScriptTypes[iscript.type];
    iscript.offsets = range(0, ct).map((x) =>
      buf.readUInt16LE(offset + 8 + 2 * x)
    );
    iscript.offsets.forEach(loadAnimationBlock);

    iscripts[iscriptIndex] = iscript;
    loadNextIScript(pos + 4);
  }

  loadNextIScript(buf.readUInt16LE(0));

  return { iscripts, animationBlocks };
};

module.exports = iscript;
