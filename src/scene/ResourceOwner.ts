interface Disposable { dispose(): void }
/** Own every allocation explicitly, including resources not attached to the graph. */
export class ResourceOwner {
  private readonly geometry = new Set<Disposable>();
  private readonly material = new Set<Disposable>();
  private readonly texture = new Set<Disposable>();
  private disposed = false;
  private own<T extends Disposable>(value: T, pool: Set<Disposable>): T {
    if (this.disposed) throw new Error('Resource owner has been disposed.');
    pool.add(value); return value;
  }
  ownGeometry<T extends Disposable>(value: T): T { return this.own(value, this.geometry); }
  ownMaterial<T extends Disposable>(value: T): T { return this.own(value, this.material); }
  ownTexture<T extends Disposable>(value: T): T { return this.own(value, this.texture); }
  get geometries(): number { return this.geometry.size; }
  get materials(): number { return this.material.size; }
  get textures(): number { return this.texture.size; }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    const unique = new Set([...this.geometry, ...this.material, ...this.texture]);
    this.geometry.clear(); this.material.clear(); this.texture.clear();
    const errors: unknown[] = [];
    for (const resource of unique) { try { resource.dispose(); } catch (error) { errors.push(error); } }
    if (errors.length) throw new AggregateError(errors, 'Resource disposal failed.');
  }
}
