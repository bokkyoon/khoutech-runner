class SimpleVersion {
  constructor (version) {
    this.elements = [];
    if (typeof version === 'string') {
      this.elements = version.split(/\./);
      let lastElement = this.elements[this.elements.length-1];
      if(typeof lastElement === 'string' && lastElement.indexOf('-') >= 0) {
        let l = lastElement.split(/-/);
        this.elements[this.elements.length-1] = l[0];
        this.suffix = l[1];
      }
    } else {
      throw new TypeError(`Invalid Version: ${version}`);
    }
  }

  toString() {
    return this.elements.join('.') + (this.suffix? ('-'+this.suffix) : '');
  }

  compare(other) {
    if (!(other instanceof SimpleVersion)) {
      if (typeof other === 'string' && other === this.version) {
        return 0;
      }
      other = new SimpleVersion(other);
    }

    let comparaison = compareInteger(this.elements.length, other.elements.length);
    if (comparaison !== 0) {
      return comparaison;
    }

    for (let i = 0; i < this.elements.length; i++) {
      comparaison = compareInteger(this.elements[i], other.elements[i]);
      if(comparaison !== 0) {
        return comparaison;
      }
    }

    return comparaison;
  }

}

function compareInteger(a, b) {
  a = +a;
  b = +b;
  return a === b ? 0 : a < b ? -1 : 1;
}

module.exports = SimpleVersion
