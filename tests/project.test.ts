import { describe, expect, it } from 'vitest';
import { createDefaultProject, validateBlueprintProject, ProjectValidationError, PRESETS } from '../src/index';
describe('BlueprintProject boundary', () => {
  it('fills omitted values from a single factory', () => expect(validateBlueprintProject({})).toEqual(createDefaultProject()));
  it('does not share mutable defaults', () => { const a = createDefaultProject(); a.camera.fov = 60; a.stations.push({id:'a',at:0,title:'A',body:''}); expect(createDefaultProject().camera.fov).toBe(45); expect(createDefaultProject().stations).toEqual([]); });
  it.each(PRESETS)('accepts preset %s and roundtrips JSON', preset => { const p = validateBlueprintProject({ art: { preset } }); expect(validateBlueprintProject(JSON.parse(JSON.stringify(p)))).toEqual(p); });
  it('preserves valid explicit input and isolates output', () => { const input = { structure: { width: 20 }, stations: [{id:'a',at:0,title:'A',body:'Text'}] }; const p = validateBlueprintProject(input); p.stations[0]!.title = 'Changed'; expect(input.stations[0]!.title).toBe('A'); expect(p.structure.width).toBe(20); expect(p.structure.depth).toBe(18); });
  it.each([null, [], 'json', {schemaVersion:2}, {unknown:true}, {camera:null}, {art:{preset:'other'}}, {quality:{dprCap:3}}, {timeline:{drawEnd:0.8,extrudeEnd:0.7}}, {title:''}, {stations:{}}, {stations:[{id:'a',at:0}]}])('rejects malformed input %#', input => expect(() => validateBlueprintProject(input)).toThrow(ProjectValidationError));
  it.each([NaN, Infinity, -Infinity, '12', 0, 101])('rejects nonfinite and invalid dimensions %s', width => expect(() => validateBlueprintProject({structure:{width}})).toThrow('$.structure.width'));
  it('rejects duplicate ids', () => expect(() => validateBlueprintProject({stations:[{id:'a',at:0,title:'A'},{id:'a',at:1,title:'B'}]})).toThrow('duplicate id'));
  it('rejects unordered stations', () => expect(() => validateBlueprintProject({stations:[{id:'a',at:1,title:'A'},{id:'b',at:0,title:'B'}]})).toThrow('strictly increasing'));
  it('rejects too many stations', () => expect(() => validateBlueprintProject({stations:Array(51).fill({})})).toThrow('at most 50'));
  it('accepts station endpoints and plain text HTML without rendering it', () => expect(validateBlueprintProject({stations:[{id:'a',at:0,title:'<script>'},{id:'b',at:1,title:'B'}]}).stations).toHaveLength(2));
});
