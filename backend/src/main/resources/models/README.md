# Model Instances

This directory contains EMF model instances for the Mogao Digital Twin.

## Directory Structure

- `instances/` - Contains model instance files (`.model` or `.xmi` files)
- These instances conform to the metamodel at `metamodel/mogao_dt.ecore`

## Creating Model Instances

You can create model instances in several ways:

### 1. Using Eclipse EMF
1. Open Eclipse with EMF installed
2. Load the `mogao_dt.ecore` metamodel
3. Create a new dynamic instance
4. Populate with data
5. Save as XMI file

### 2. Using Flexmi (Human-readable format)
Create a `.flexmi` file with simplified syntax:

```xml
<?nsuri http://digital.twin.mogao/1.0?>
<dtPackage name="MogaoCaves">
  <objects xsi:type="Cave" gid="cave-001" name="Cave 1" label="Mogao Cave 1">
    <exhibits xsi:type="Mural" gid="mural-001" name="Mural A"
              width="2000" height="1500" technique="fresco"/>
  </objects>
</dtPackage>
```

### 3. Programmatically using EOL scripts
Use the EOL operations to create model instances:

```eol
var cave = new Cave;
cave.gid = "cave-001";
cave.name = "Cave 1";
```

## Example Model Instance

See `instances/example.flexmi` for a sample model instance.
