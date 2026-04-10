import json

from agent.genome import Genome


def test_random_genome_values_in_range():
    g = Genome.random()
    assert 0.0 <= g.risk_appetite <= 1.0
    assert 0.0 <= g.entry_threshold <= 1.0
    assert 0.0 <= g.exit_threshold <= 1.0
    assert 0.1 <= g.position_size <= 0.5
    assert 1 <= g.max_holdings <= 10
    assert 0.0 <= g.graduation_bias <= 1.0
    assert 0.0 <= g.creation_frequency <= 1.0
    assert len(g.theme_vector) == 8
    assert all(0.0 <= v <= 1.0 for v in g.theme_vector)
    assert 0 <= g.naming_style <= 4
    assert 0.0 <= g.hype_intensity <= 1.0
    assert 0.0 <= g.follow_leader <= 1.0
    assert 0.0 <= g.contrarian <= 1.0
    assert 0.0 <= g.herd_sensitivity <= 1.0
    assert 0.0 <= g.cooperation <= 1.0
    assert 0.0 <= g.experiment_rate <= 1.0
    assert 0.0 <= g.adaptation_speed <= 1.0
    assert 0.0 <= g.memory_weight <= 1.0
    assert 0.0 <= g.exploration_vs_exploit <= 1.0


def test_genome_to_dict_and_from_dict():
    g = Genome.random()
    d = g.to_dict()
    g2 = Genome.from_dict(d)
    assert g == g2


def test_genome_to_json_roundtrip():
    g = Genome.random()
    j = json.dumps(g.to_dict())
    g2 = Genome.from_dict(json.loads(j))
    assert g == g2


def test_genome_to_flat_vector():
    g = Genome.random()
    vec = g.to_vector()
    # 6 trading + 1 creation_freq + 8 theme + 1 naming + 1 hype
    # + 4 social + 4 meta = 25 floats
    assert len(vec) == 25
    assert all(isinstance(v, float) for v in vec)


def test_genome_from_vector_roundtrip():
    g = Genome.random()
    vec = g.to_vector()
    g2 = Genome.from_vector(vec)
    assert g == g2


def test_genome_clamp():
    g = Genome.random()
    # Force out-of-range
    g.risk_appetite = 1.5
    g.position_size = -0.1
    g.max_holdings = 15
    g.naming_style = 7
    g.clamp()
    assert g.risk_appetite == 1.0
    assert g.position_size == 0.1
    assert g.max_holdings == 10
    assert g.naming_style == 4


def test_genome_distance():
    g1 = Genome.random()
    g2 = Genome.random()
    d = g1.distance(g2)
    assert d >= 0.0
    assert g1.distance(g1) == 0.0
